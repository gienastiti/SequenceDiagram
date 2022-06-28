import GetAuthRequest from './GetAuthRequest.mjs';
import GetAuthResponse from './GetAuthResponse.mjs';
import GetAuthResponseV2 from './GetAuthResponseV2.mjs';
import UploadFileRequest from './UploadFileRequest.mjs';
import ErrorMessageResponse from './ErrorMessageResponse.mjs';

export default class SharePoint{
  constructor({
    response = new GetAuthResponse(),
    invalidResp = new GetAuthResponseV2(),
    request = new GetAuthRequest()
  }) {
    this.request = null;
  }
  
  httpGetRequest() {
    const xhttp = new XMLHttpRequest();
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Accept", "application/json");
    xhttp.open("GET", 'https://accounts.accesscontrol.windows.net/fc743075-93ed-4a5c-82c0-ca5eac914220/tokens/OAuth/2', false );
    xhttp.setGetAuth("Ocp-Apim-Subscription-Key",key);
    xhttp.send(null);
    return xhttp.responseText;
  }

  getAccessToken(){

  }
}