import { describe, expect, it } from 'vitest';
import { canAccess, buildPayload } from './accessControl';

const file = { name: 'salary_records.xlsx', minLevel: 2, content: 'secret' };
const role = { id: 'analyst', label: 'Security Analyst', level: 1 };
const fileTree = [{ folder: 'HR', files: [file] }];

describe('access control helpers', () => {
  it('blocks access to files above the current role level', () => {
    expect(canAccess(role, file)).toBe(false);
  });

  it('returns null content for restricted files in secure mode', () => {
    const payload = buildPayload('secure', role, fileTree);
    expect(payload[0].files[0].content).toBeNull();
  });

  it('includes restricted content in insecure mode', () => {
    const payload = buildPayload('insecure', role, fileTree);
    expect(payload[0].files[0].content).toBe('secret');
  });
});
