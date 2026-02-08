import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should truncate text longer than limit', () => {
    const text = 'This is a very long text that should be truncated';
    const result = pipe.transform(text, 20);
    
    expect(result).toBe('This is a very long ...');
    expect(result.length).toBe(23); // 20 + '...'
  });

  it('should not truncate text shorter than limit', () => {
    const text = 'Short text';
    const result = pipe.transform(text, 20);
    
    expect(result).toBe('Short text');
  });

  it('should handle empty string', () => {
    const result = pipe.transform('', 20);
    expect(result).toBe('');
  });

  it('should handle null or undefined', () => {
    expect(pipe.transform(null as any, 20)).toBe('');
    expect(pipe.transform(undefined as any, 20)).toBe('');
  });

  it('should handle text exactly at limit', () => {
    const text = 'Exactly twenty chars';
    const result = pipe.transform(text, 20);
    
    expect(result).toBe('Exactly twenty chars');
  });

  it('should use default limit of 50', () => {
    const text = 'a'.repeat(60);
    const result = pipe.transform(text);
    
    expect(result.length).toBe(53); // 50 + '...'
  });
});
