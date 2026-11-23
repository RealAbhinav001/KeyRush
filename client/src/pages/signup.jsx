import { useState } from "react";
import {signUpSchema} from "@keyrush/shared"
import { signUp } from "../api/auth";
import { useDispatch } from 'react-redux'
import { signedIn } from "../features/auth/authSlice";
import { useNavigate } from 'react-router'


const userFieldErrors = {
    username:"",
    email:"",
    password:""
  }


const SignUp = () => {
  const [values,setValues] = useState({
    username:"",
    email:"",
    password:""
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [formError,setFormError] = useState(null)

  const [fieldErrors,setFieldErrors] = useState(userFieldErrors)

  const [isSubmitting,setIsSubmitting] = useState(false)

  const handleFormChange = (e)=>{
    const {name,value} = e.target;

    setValues(prev =>({...prev,[name]:value}))
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()

    if(isSubmitting !== false)return

    setFormError(null)
    setFieldErrors(userFieldErrors)

    const result = signUpSchema.safeParse(values)
    if(result.success === false){
      const newObject = {};

      for(const item of result.error.issues){
        const stringItem = item.path.join(".")

        if(stringItem in newObject){
          newObject[stringItem] += ". " + item.message
        }
        else{
          newObject[stringItem] = item.message
        }

        
      }

      setFieldErrors(newObject)

      return
    }

    setIsSubmitting(true)

    try{
      const user = await signUp(result.data)

      dispatch(signedIn(user))

      navigate("/dashboard")

    }

    catch(error){
      if(Object.keys(error?.details || {}).length>0){
        setFieldErrors(error.details)
      }
      else{
        setFormError(error.message)
      }

      setIsSubmitting(false)
    }


  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <input type="text" placeholder="Enter your username Here" name="username" value={values.username} onChange={handleFormChange}/>
      {fieldErrors.username && <p>{fieldErrors.username}</p>}
      <input type="email" placeholder="Enter your email Here" name="email" value={values.email} onChange={handleFormChange}/>
      {fieldErrors.email && <p>{fieldErrors.email}</p>}
      <input type="password" placeholder="Enter your password Here" name="password" value={values.password} onChange={handleFormChange}/>
      {fieldErrors.password && <p>{fieldErrors.password}</p>}

      {formError && <p>{formError}</p>}
      <button type="submit" disabled={isSubmitting}>Submit</button>
    </form>
  );
};

export default SignUp;
