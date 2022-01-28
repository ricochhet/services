**It is not recommended to use this in any actual software where security is of ANY importance.
It is simply a demonstration piece, if you truly wanted a simple solution like this, and needed authorization
capabilities, please use a different authorization method, basic auth is not recommended.**

# services

HTTP Microservices

# Usage

-   `npm install`
-   Run example case: `node .`
-   Goto `localhost:8080`
-   Test auth with something like Postman
    -   Input a username and password in the Basic Auth authorization
    -   The username and password are obtained from the "userHashTable.json"
    -   You can create an username/password hash with the src/cli
    -   An example is also included, using "username" and "password" in the input fields respectively
