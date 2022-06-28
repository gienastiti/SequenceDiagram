export default class GetAuthResponseV2 {
  constructor(error, error_description = [], error_codes, timestamp, trace_id, correlation_id, error_uri) {
    this.error = error;
    this.error_description = error_description;
    this.timestamp = timestamp;
    this.trace_id = trace_id;
    this.correlation_id = correlation_id;
    this.error_uri = this.error_uri;
  }

  getError(){
    return this.error;
  }

  setError(error){
    this.error = error;
  }

  getError_Description(){
    return this.error_description;
  }

  setError_Description(error_description){
    this.error_description = error_description;
  }

  getTimestamp(){
    return this.timestamp;
  }

  setTimestamp(timestamp){
    this.timestamp = timestamp;
  }

  getTrace_Id(){
    return this.trace_id;
  }

  setTrace_Id(trace_id){
    this.trace_id = trace_id;
  }

  getCorrelation_Id(){
    return this.correlation_id;
  }

  setCorrelation_Id(correlation_id){
    this.correlation_id = correlation_id;
  }

  getError_Uri(){
    return this.error_uri;
  }

  setError_Uri(error_uri){
    this.error_uri = error_uri;
  }
}
