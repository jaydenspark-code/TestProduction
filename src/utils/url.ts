import { Transform } from './transform';

type QueryValue = string | number | boolean | null | undefined;
type QueryObject = Record<string, QueryValue | QueryValue[]>;

export class UrlBuilder {
  private url: URL;

  constructor(baseUrl: string) {
    try {
      this.url = new URL(baseUrl);
    } catch (error) {
      throw new Error(`Invalid URL: ${baseUrl}`);
    }
  }

  // Path manipulation
  setPath(path: string): this {
    this.url.pathname = path.startsWith('/')
      ? path
      : `/${path}`;
    return this;
  }

  addPath(path: string): this {
    const normalizedPath = path.startsWith('/')
      ? path.slice(1)
      : path;
    this.url.pathname = this.url.pathname.replace(
      /\/?$/,
      `/${normalizedPath}`
    );
    return this;
  }

  // Query parameters
  setQuery(key: string, value: QueryValue | QueryValue[]): this {
    if (value === null || value === undefined) {
      this.url.searchParams.delete(key);
      return this;
    }

    if (Array.isArray(value)) {
      this.url.searchParams.delete(key);
      value.forEach((v) => {
        if (v !== null && v !== undefined) {
          this.url.searchParams.append(key, String(v));
        }
      });
    } else {
      this.url.searchParams.set(key, String(value));
    }

    return this;
  }

  setQueryObject(params: QueryObject): this {
    Object.entries(params).forEach(([key, value]) => {
      this.setQuery(key, value);
    });
    return this;
  }

  removeQuery(key: string): this {
    this.url.searchParams.delete(key);
    return this;
  }

  clearQuery(): this {
    this.url.search = '';
    return this;
  }

  // Hash fragment
  setHash(hash: string): this {
    this.url.hash = hash.startsWith('#')
      ? hash
      : `#${hash}`;
    return this;
  }

  removeHash(): this {
    this.url.hash = '';
    return this;
  }

  // URL string output
  toString(): string {
    return this.url.toString();
  }

  toObject(): {
    protocol: string;
    host: string;
    pathname: string;
    search: string;
    hash: string;
  } {
    return {
      protocol: this.url.protocol,
      host: this.url.host,
      pathname: this.url.pathname,
      search: this.url.search,
      hash: this.url.hash
    };
  }

  // Static methods
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static join(...parts: string[]): string {
    return parts
      .map((part, index) => {
        if (index === 0) {
          return part.endsWith('/')
            ? part.slice(0, -1)
            : part;
        }
        return part
          .split('/')
          .filter(Boolean)
          .join('/');
      })
      .join('/');
  }
}

export class QueryString {
  static parse(queryString: string): QueryObject {
    if (!queryString) {
      return {};
    }

    const normalized = queryString.startsWith('?')
      ? queryString.slice(1)
      : queryString;

    const params = new URLSearchParams(normalized);
    const result: QueryObject = {};

    params.forEach((value, key) => {
      if (key in result) {
        const existing = result[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          result[key] = [existing as string, value];
        }
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  static stringify(params: QueryObject): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== null && v !== undefined) {
            searchParams.append(key, String(v));
          }
        });
      } else {
        searchParams.set(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  static getParam(
    queryString: string,
    key: string,
    defaultValue?: QueryValue
  ): QueryValue {
    const params = QueryString.parse(queryString);
    return key in params ? params[key] : defaultValue;
  }

  static getParamAsString(
    queryString: string,
    key: string,
    defaultValue = ''
  ): string {
    const value = QueryString.getParam(queryString, key, defaultValue);
    return Transform.toString(value, { defaultValue });
  }

  static getParamAsNumber(
    queryString: string,
    key: string,
    defaultValue = 0
  ): number {
    const value = QueryString.getParam(queryString, key, defaultValue);
    return Transform.toNumber(value, { defaultValue });
  }

  static getParamAsBoolean(
    queryString: string,
    key: string,
    defaultValue = false
  ): boolean {
    const value = QueryString.getParam(queryString, key, defaultValue);
    return Transform.toBoolean(value, { defaultValue });
  }

  static getParamAsArray(
    queryString: string,
    key: string,
    defaultValue: string[] = []
  ): string[] {
    const params = QueryString.parse(queryString);
    const value = params[key];

    if (Array.isArray(value)) {
      return value;
    }

    if (value === undefined || value === null) {
      return defaultValue;
    }

    return [String(value)];
  }
}

// Example usage:
/*
// URL Builder
const url = new UrlBuilder('https://api.example.com')
  .setPath('/users')
  .setQuery('page', 1)
  .setQuery('sort', 'name')
  .setQuery('filters', ['active', 'verified'])
  .setHash('top')
  .toString();
// https://api.example.com/users?page=1&sort=name&filters=active&filters=verified#top

// URL Joining
const baseUrl = 'https://api.example.com/';
const path = '/users/123';
const joinedUrl = UrlBuilder.join(baseUrl, path);
// https://api.example.com/users/123

// Query String Parsing
const params = QueryString.parse('?page=1&sort=name&filters=active&filters=verified');
// { page: '1', sort: 'name', filters: ['active', 'verified'] }

// Query String Building
const queryString = QueryString.stringify({
  page: 1,
  sort: 'name',
  filters: ['active', 'verified']
});
// ?page=1&sort=name&filters=active&filters=verified

// Parameter Extraction
const query = '?page=1&show=true&count=42&tags=a,b,c';
const page = QueryString.getParamAsNumber(query, 'page', 1);
const show = QueryString.getParamAsBoolean(query, 'show', false);
const tags = QueryString.getParamAsArray(query, 'tags', []);
*/