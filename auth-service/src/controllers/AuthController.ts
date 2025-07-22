import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../models/User';

export class AuthController {
  private authService: AuthService;
  
  constructor() {
    this.authService = new AuthService();
  }
  
  /**
   * Register validation rules
   */
  registerValidation = [
    body('username').isString().trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
    body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
    body('role').isIn(Object.values(UserRole)).withMessage('Invalid role')
  ];
  
  /**
   * Login validation rules
   */
  loginValidation = [
    body('username').isString().trim().notEmpty().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required')
  ];
  
  /**
   * Register a new user
   */
  register = async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role
      };
      
      const user = await this.authService.registerUser(userData);
      
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  /**
   * Login user
   */
  login = async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const credentials = {
        username: req.body.username,
        password: req.body.password
      };
      
      const tokens = await this.authService.login(credentials);
      
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh-token'
      });
      
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }
      
      const tokens = await this.authService.refreshToken(refreshToken);
      
      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth/refresh-token'
      });
      
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      });
    } catch (error: any) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  };
  
  /**
   * Logout user
   */
  logout = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        await this.authService.logout(refreshToken);
        
        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/api/auth/refresh-token'
        });
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const user = await this.authService.getUserById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
      };
      
      const user = await this.authService.updateUser(req.user.userId, userData);
      
      res.json(user);
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  /**
   * Change password
   */
  changePassword = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
      }
      
      await this.authService.changePassword(req.user.userId, currentPassword, newPassword);
      
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ message: 'User not found' });
      }
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
}