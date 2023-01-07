import { App, Notice } from 'obsidian';
import WordpressPlugin from './main';
import {
  WordPressAuthParams,
  WordPressClientResult,
  WordPressClientReturnCode,
  WordPressPostParams
} from './wp-client';
import { XmlRpcClient } from './xmlrpc-client';
import { AbstractWordPressClient } from './abstract-wp-client';
import { Category, Term } from './wp-api';
import { ERROR_NOTICE_TIMEOUT } from './consts';

interface FaultResponse {
  faultCode: string;
  faultString: string;
}

function isFaultResponse(response: unknown): response is FaultResponse {
  return (response as FaultResponse).faultCode !== undefined;
}

export class WpXmlRpcClient extends AbstractWordPressClient {

  private readonly client: XmlRpcClient;

  constructor(
    readonly app: App,
    readonly plugin: WordpressPlugin
  ) {
    super(app, plugin);
    this.client = new XmlRpcClient({
      url: new URL(plugin.settings.endpoint),
      xmlRpcPath: plugin.settings.xmlRpcPath
    });
  }

  publish(title: string, content: string, postParams: WordPressPostParams, wp: WordPressAuthParams): Promise<WordPressClientResult> {
    return this.client.methodCall('metaWeblog.newPost', [
      1,
      wp.username,
      wp.password,
      {
        post_type: 'post',
        post_status: postParams.status,
        mt_allow_comments: postParams.commentStatus,
        title: title,
        description: content,
        categories: postParams.categories
      },
      true
    ])
      .then(response => {
        if (isFaultResponse(response)) {
          return {
            code: WordPressClientReturnCode.Error,
            data: {
              code: response.faultCode,
              message: response.faultString
            }
          };
        }
        return {
          code: WordPressClientReturnCode.OK,
          data: response
        };
      });
  }

  getCategories(wp: WordPressAuthParams): Promise<Category[]> {
    return this.client.methodCall('wp.getCategories', [
      1,
      wp.username,
      wp.password
    ])
      .then(response => {
        if (isFaultResponse(response)) {
          const fault = `${response.faultCode}: ${response.faultString}`;
          new Notice(fault, ERROR_NOTICE_TIMEOUT);
          throw new Error(fault);
        }
        return response;
      })
      .then((data: unknown[]) => {
        return data.map((it: any) => ({
          ...it,
          id: it.categoryId
        })) ?? [];
      });
  }

  validateUser(certificate: WordPressAuthParams): Promise<WordPressClientResult> {
    return this.client.methodCall('wp.getProfile', [
      1,
      certificate.username,
      certificate.password
    ])
      .then(response => {

        new Notice( JSON.stringify(response), ERROR_NOTICE_TIMEOUT);

        if (isFaultResponse(response)) {
          return {
            code: WordPressClientReturnCode.Error,
            data: `${response.faultCode}: ${response.faultString}`
          };
        } else {
          return {
            code: WordPressClientReturnCode.OK,
            data: response
          };
        }
      });
  }

}
