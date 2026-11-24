import { useState } from "react"
import { loginSchema } from "@keyrush/shared"
import { logIn } from "../api/auth"
import { useNavigate } from "react-router"
import { useDispatch } from "react-redux"
import { signedIn } from "../features/auth/authSlice"


const userFieldErrors = {
    email:"",
    password:""
}

const LogIn = ()=>{
    const [values,setValues] = useState({
        email:"",
        password:""
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [fieldErrors,setFieldErrors] = useState(userFieldErrors)

    const [formError,setFormError] = useState(null)

    const [isSubmitting,setIsSubmitting] = useState(false)

    const handleChange = (e)=>{
        const {name,value} = e.target

        setValues(prev =>({...prev,[name]:value}))
    }

    const handleSubmit =async (e)=>{
        e.preventDefault()

        if(isSubmitting === true) return

        setFieldErrors(userFieldErrors)
        setFormError(null)

        const result = loginSchema.safeParse(values)

        if(result.success === false){
            const newObject = {}

            for(const item of result.error.issues){
                const stringPath = item.path.join(".")

                if(stringPath in newObject){
                    newObject[stringPath] += ". " + item.message
                }
                else{
                    newObject[stringPath] = item.message
                }
            }

            setFieldErrors(newObject)

            return
        }

        setIsSubmitting(true)

        try{
            const user = await logIn(result.data)

            dispatch(signedIn(user))
            navigate("/dashboard")


        }
        catch(error){
            if(Object.keys(error?.details || {}).length >0){
                setFieldErrors(error.details)
            }
            else{
                setFormError(error.message)
            }
            setIsSubmitting(false)
        }
    }

    return(
        <div className="main-container">
            <form onSubmit={handleSubmit} noValidate>
                <input type="email" placeholder="Enter your Email Here" name="email" value={values.email} onChange={handleChange}/>
                {fieldErrors.email && <p>{fieldErrors.email}</p>}
                <input type="password" placeholder="Password" name="password" value={values.password} onChange={handleChange}/>
                {fieldErrors.password && <p>{fieldErrors.password}</p>}


                {formError && <p>{formError}</p>}
                <button type="submit" disabled={isSubmitting}>Submit</button>


            </form>
        </div>
    )
}

export default LogIn