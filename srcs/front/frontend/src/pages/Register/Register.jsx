const Register = () => {
    return (
        <div>
            <form>
                <input type="text" name="username" placeholder="Enter Username"/>
                <input type="text" name="password" placeholder="Enter Password"/>
                <input type="text" name="passwordVerif" placeholder="Confirm Password"/>
                <input type="submit"/>
            </form>
        </div>
    )
}

export default Register