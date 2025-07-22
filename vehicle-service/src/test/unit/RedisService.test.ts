import RedisService from '../../services/RedisService';
import { createClient } from 'redis';

// Mock redis client
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    on: jest.fn()
  };
  
  return {
    createClient: jest.fn().mockReturnValue(mockClient)
  };
});

describe('RedisService', () => {
  let mockRedisClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient = (createClient as jest.Mock)();
  });
  
  describe('get', () => {
    it('should get a value from Redis', async () => {
      mockRedisClient.get.mockResolvedValue('test-value');
      
      const result = await RedisService.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });
    
    it('should handle errors when getting a value', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
      
      const result = await RedisService.get('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
  });
  
  describe('getJson', () => {
    it('should get and parse a JSON value from Redis', async () => {
      const testObject = { name: 'test', value: 123 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testObject));
      
      const result = await RedisService.getJson('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testObject);
    });
    
    it('should return null if the key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      
      const result = await RedisService.getJson('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
    
    it('should handle JSON parsing errors', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json');
      
      const result = await RedisService.getJson('test-key');
      
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBeNull();
    });
  });
  
  describe('set', () => {
    it('should set a value in Redis without TTL', async () => {
      await RedisService.set('test-key', 'test-value');
      
      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
    });
    
    it('should set a value in Redis with TTL', async () => {
      await RedisService.set('test-key', 'test-value', 60);
      
      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value', { EX: 60 });
    });
    
    it('should handle errors when setting a value', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));
      
      await RedisService.set('test-key', 'test-value');
      
      expect(mockRedisClient.set).toHaveBeenCalled();
    });
  });
  
  describe('setJson', () => {
    it('should stringify and set a JSON value in Redis', async () => {
      const testObject = { name: 'test', value: 123 };
      
      await RedisService.setJson('test-key', testObject, 60);
      
      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify(testObject), { EX: 60 });
    });
  });
  
  describe('del', () => {
    it('should delete a key from Redis', async () => {
      await RedisService.del('test-key');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
    
    it('should handle errors when deleting a key', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));
      
      await RedisService.del('test-key');
      
      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });
  
  describe('keys', () => {
    it('should get keys matching a pattern from Redis', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);
      
      const result = await RedisService.keys('test-*');
      
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test-*');
      expect(result).toEqual(['key1', 'key2']);
    });
    
    it('should handle errors when getting keys', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));
      
      const result = await RedisService.keys('test-*');
      
      expect(mockRedisClient.keys).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
  
  describe('invalidatePattern', () => {
    it('should delete all keys matching a pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);
      
      await RedisService.invalidatePattern('test-*');
      
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test-*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });
    
    it('should not call del if no keys match the pattern', async () => {
      mockRedisClient.keys.mockResolvedValue([]);
      
      await RedisService.invalidatePattern('test-*');
      
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test-*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });
});