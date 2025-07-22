import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../utils/dbConnection';
import { 
  User, 
  UserDTO, 
  CreateUserDTO, 
  UpdateUserDTO, 
  LoginCredentials, 
  TokenPayload, 
  AuthTokens 
} from '../models/User';
import { RedisService } from './RedisService';

export class AuthService {
  private redisService: RedisService;
  
  constructor() {
    this.redisService = new RedisService();
  }

  /**
   * Register a new user
   */
  async registerUser(userData: CreateUserDTO): Promise<UserDTO> {
    const { username, email, password, firstName, lastName, role } = userData;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this username or email already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const userId = uuidv4();
    const now = new Date();
    
    const result = await pool.query(
      `INSERT INTO users (
        id, username, email, password, first_name, last_name, role, active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, username, email, hashedPassword, firstName, lastName, role, true, now, now]
    );
    
    const user = result.rows[0];
    
    return this.mapUserToDTO(user);
  }
  
  /**
   * Login user and generate tokens
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { username, password } = credentials;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate tokens
    return this.generateTokens(user);
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'default_secret') as TokenPayload & { exp: number };
      
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new Error('Invalid token');
      }
      
      // Get user
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND active = true',
        [decoded.userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  /**
   * Logout user by blacklisting refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'default_secret') as { exp: number };
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (ttl > 0) {
        await this.redisService.set(`blacklist:${refreshToken}`, 'true', ttl);
      }
    } catch (error) {
      // Token is invalid or expired, no need to blacklist
    }
  }
  
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserDTO | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapUserToDTO(result.rows[0]);
  }
  
  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserDTO): Promise<UserDTO> {
    const { firstName, lastName, email, role, active } = userData;
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    
    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    
    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    
    // Add userId as the last parameter
    values.push(userId);
    
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return this.mapUserToDTO(result.rows[0]);
  }
  
  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3',
      [hashedPassword, new Date(), userId]
    );
  }
  
  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
    );
    
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
    );
    
    // Calculate expiration time in seconds
    const jwtAccessExpiration = process.env.JWT_ACCESS_EXPIRATION || '15m';
    const expiresIn = this.parseExpirationToSeconds(jwtAccessExpiration);
    
    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }
  
  /**
   * Parse JWT expiration string to seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default to 15 minutes (900 seconds)
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900;
    }
  }
  
  /**
   * Map database user to DTO
   */
  private mapUserToDTO(user: any): UserDTO {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      active: user.active
    };
  }
}