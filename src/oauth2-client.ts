import { generateQueryString, openWithBrowser } from './utils';
import { requestUrl } from 'obsidian';
import { WordPressClientResult, WordPressClientReturnCode } from './wp-client';
import WordpressPlugin from './main';

export interface OAuth2Token {
  accessToken: string;
}

export interface WordPressOAuth2Token extends OAuth2Token {
  tokenType: string;
  blogId: string;
  blogUrl: string;
  scope: string;
}

export interface GetAuthorizeCodeParams {
  redirectUri: string;
  scope?: string[];
  blog?: string;
  codeVerifier?: string;
}

export interface GetTokenParams {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface ValidateTokenParams {
  token: string;
}

export interface OAuth2Options {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
  authorizeEndpoint: string;
  validateTokenEndpoint?: string;
}

export class OAuth2Client {

  constructor(
    private readonly options: OAuth2Options,
    private readonly plugin: WordpressPlugin
  ) {
    console.log(options);
  }

  async getAuthorizeCode(params: GetAuthorizeCodeParams): Promise<void> {
    const query: {
      client_id: string;
      response_type: 'code';
      redirect_uri: string;
      code_challenge_method?: 'plain' | 'S256';
      code_challenge?: string;
      blog?: string;
      scope?: string;
    } = {
      client_id: this.options.clientId,
      response_type: 'code',
      redirect_uri: params.redirectUri,
      blog: params.blog,
      scope: undefined
    };
    if (params.scope) {
      query.scope = params.scope.join(' ');
    }
    if (params.codeVerifier) {
      const codeChallenge = await getCodeChallenge(params.codeVerifier);
      query.code_challenge_method = codeChallenge?.[0];
      query.code_challenge = codeChallenge?.[1];
    }
    openWithBrowser(this.options.authorizeEndpoint, query);
  }

  getToken(params: GetTokenParams): Promise<WordPressOAuth2Token> {
    const body: {
      grant_type: 'authorization_code';
      client_id: string;
      code: string;
      redirect_uri: string;
    } = {
      grant_type: 'authorization_code',
      client_id: this.options.clientId,
      code: params.code,
      redirect_uri: params.redirectUri
    };
    return requestUrl({
      url: this.options.tokenEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'obsidian.md'
      },
      body: generateQueryString(body)
    })
      .then(response => {
        console.log('getToken response', response);
        const resp = response.json;
        return {
          accessToken: resp.access_token,
          tokenType: resp.token_type,
          blogId: resp.blog_id,
          blogUrl: resp.blog_url,
          scope: resp.scope
        };
      });
  }

  validateToken(params: ValidateTokenParams): Promise<WordPressClientResult> {
    if (!this.options.validateTokenEndpoint) {
      throw new Error('No validate token endpoint set.');
    }
    return requestUrl({
      url: `${this.options.validateTokenEndpoint}?client_id=${this.options.clientId}&token=${params.token}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'obsidian.md'
      }
    })
      .then(response => {
        console.log('validateToken response', response);
        return {
          code: WordPressClientReturnCode.OK,
          data: 'done'
        };
      })
      .catch(error => {
        return {
          code: WordPressClientReturnCode.Error,
          data: this.plugin.i18n.t('error_invalidWpComToken')
        };
      });
  }
}

export function generateCodeVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64Url(arr);
}

async function getCodeChallenge(codeVerifier: string): Promise<['plain' | 'S256', string]> {
  return ['S256', base64Url(await crypto.subtle.digest('SHA-256', stringToBuffer(codeVerifier)))];
}

function stringToBuffer(input: string): ArrayBuffer {
  const buf = new Uint8Array(input.length);
  for(let i = 0; i < input.length; i++) {
    buf[i] = input.charCodeAt(i) & 0xFF;
  }
  return buf;
}

function base64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
