import ErrorMessageV2 from './ErrorMessageV2.mjs';

export default class ErrorMessageResponse {
  constructor(
    error = new ErrorMessageV2()
  ) {
    this.error = error;
  }

  getError(){
    return ErrorMessageV2;
  }

  setMessage(ErrorMessageV2){
    this.error = this.error;
  }
}
