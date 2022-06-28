export default class GetAuthResponse {
  constructor(token_type, expires_in, not_before, expires_on, resource, access_token) {
    this.token_type = token_type;
    this.expires_in = expires_in;
    this.not_before = not_before;
    this.resource = resource;
    this.access_token = access_token;
  }

  getToken_Type(){
    return this.token_type;
  }

  setToken_Type(token_type){
    this.token_type = token_type;
  }

  getExpires_In(){
    return this.expires_in;
  }

  setExpires_In(expires_in){
    this.expires_in = expires_in;
  }

  getNot_Before(){
    return this.not_before;
  }


  getExpires_On(){
    return this.expires_on;
  }

  setExpires_On(expires_on){
    this.expires_in = expires_on;
  }
  
  getResource(){
    return this.resource;
  }

  setResource(resource){
    this.resource = resource;
  }

  getAccess_Token(){
    return this.access_token;
  }

  setAccess_Token(){
    this.access_token = this.access_token;
  }
}
