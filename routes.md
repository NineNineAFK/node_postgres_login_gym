1. **GET "/"**
   - Renders the home page.

2. **GET "/users/register"**
   - Renders the registration page for users.

3. **POST "/users/register"**
   - Handles the user registration form submission, validates the form data, hashes the password, checks if the email is already registered, and inserts the user into the database. Redirects to login page upon successful registration.

4. **GET "/users/login"**
   - Renders the login page for users.

5. **POST "/users/login"**
   - Handles the user login form submission using Passport authentication. Redirects to the dashboard upon successful login.

6. **GET "/users/dashboard"**
   - Renders the dashboard page for logged-in users.

7. **GET "/users/logout"**
   - Logs out the user and redirects to the login page.

8. **GET "/users/admin/login"**
   - Renders the login page for admins.

9. **GET "/users/admin/superuser"**
   - Renders the login page for superusers.

10. **POST "/users/admin/superuser"**
    - Handles the superuser login form submission using Passport authentication. Redirects to the superuser home page upon successful login.

11. **GET "/superuser/home"**
    - Renders the home page for superusers.

12. **GET "/superuser/adminRegister"**
    - Renders the admin registration page for superusers.

13. **POST "/superuser/adminRegister"**
    - Handles the admin registration form submission, similar to user registration but for admins.

14. **GET "/superuser/adminDelete"**
    - Retrieves a list of admins and renders a page for superusers to delete admins.

15. **POST "/superuser/adminDelete/:id"**
    - Handles the deletion of admins by superusers based on admin ID.
