import ErrorMessage from './ErrorMessage.mjs';

export default class ErrorMessageV2 {
  constructor(
    code,
    message = new ErrorMessage()
  ) {
    this.code = code;
    this.message = message;
  }

  getCode(){
    return this.code;
  }

  setCode(code){
    this.code = code;
  }

  getMessage(){
    return ErrorMessage;
  }

  setMessage(ErrorMessage){
    this.message = message;
  }
}
