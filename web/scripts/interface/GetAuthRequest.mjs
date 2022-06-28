export default class GetAuthRequest {
  constructor(grant_type, client_id, client_secret, resource) {
    this.grant_type = grant_type;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.resource = resource;
  }

  getGrant_Type(){
    return this.grant_type;
  }
  
  setGrant_Type(grant_type){
    this.grant_type = grant_type;
  }

  getClient_Id(){
    return this,this.client_id;
  }

  setClient_Id(client_id){
    this.client_id = client_id;
  }

  getClient_Secret(){
    return this.client_secret;
  }

  setClient_Secret(client_secret){
    this.client_secret = this.client_secret;
  }

  getResource() {
    return this.resource;
  }

  setResource(resource){
    this.resource = resource;
  }

}

let GetAuthSharePoint = new GetAuthSharePoint(
  "client_credentials", 
  "d3e9104b-3972-4bbe-98c5-7ba5c06416f8@fc743075-93ed-4a5c-82c0-ca5eac914220", 
  "CkJOY5+RUpv4aa5Ioh4J0lFYwCaLkhMXBvWPW+m34Ok=", 
  "00000003-0000-0ff1-ce00-000000000000/365tsel.sharepoint.com@fc743075-93ed-4a5c-82c0-ca5eac914220"
  );
