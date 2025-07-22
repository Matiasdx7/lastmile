import { AuthService } from '../../services/AuthService';
import { UserRole } from '../../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../utils/dbConnection', () => ({
  query: jest.fn()
}));

jest.mock('../../services/RedisService', () => {
  return {
    RedisService: jest.fn().mockImplementation(() => {
      return {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-123', username: 'testuser', role: 'admin' })
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Import mocked dependencies
import pool from '../../utils/dbConnection';

describe('AuthService', () => {
  let authService: AuthService;
  const mockPool = pool as jest.Mocked<typeof pool>;
  
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });
  
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Mock database response for checking existing user
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      
      // Mock database response for creating user
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: UserRole.ADMIN,
          active: true
        }]
      });
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN
      };
      
      const result = await authService.registerUser(userData);
      
      expect(result).toEqual({
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        active: true
      });
      
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
    
    it('should throw error if user already exists', async () => {
      // Mock database response for checking existing user
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-user' }]
      });
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN
      };
      
      await expect(authService.registerUser(userData)).rejects.toThrow('User with this username or email already exists');
      
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('login', () => {
    it('should login user and return tokens', async () => {
      // Mock database response
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          username: 'testuser',
          password: 'hashed-password',
          role: UserRole.ADMIN
        }]
      });
      
      const credentials = {
        username: 'testuser',
        password: 'password123'
      };
      
      const result = await authService.login(credentials);
      
      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        expiresIn: expect.any(Number)
      });
      
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
    
    it('should throw error if user not found', async () => {
      // Mock database response
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      
      const credentials = {
        username: 'testuser',
        password: 'password123'
      };
      
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
    
    it('should throw error if password is invalid', async () => {
      // Mock database response
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          username: 'testuser',
          password: 'hashed-password',
          role: UserRole.ADMIN
        }]
      });
      
      // Mock password comparison to fail
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      const credentials = {
        username: 'testuser',
        password: 'wrong-password'
      };
      
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Mock database response
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          username: 'testuser',
          role: UserRole.ADMIN
        }]
      });
      
      const result = await authService.refreshToken('valid-refresh-token');
      
      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        expiresIn: expect.any(Number)
      });
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
    
    it('should throw error if token is invalid', async () => {
      // Mock jwt.verify to throw error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow('Invalid token');
    });
  });
});