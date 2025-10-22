import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { AcademicYear } from "./types";

export
 
const
 getCurrent = api(
  { 
method
: 
"GET"
, 
path
: 
"/academic/current"
, 
expose
: 
true
 },
  
async
 (): 
Promise
<AcademicYear> => {
    
const
 { data, error } = 
await
 supabase.rpc(
"get_current_academic_year"
);
    
if
 (error) {
      
// handle or rethrow so the caller gets an error response

      
throw
 
new
 
Error
(error.message);
    }
    
// RPC might return an array or single object depending on implementation

    
if
 (
Array
.isArray(data)) {
      
return
 data[
0
] 
as
 AcademicYear;
    }
    
return
 data 
as
 AcademicYear;
  }
);