# School-fullStack
I developed this application using React for the frontend, integrating FullCalendar to manage event scheduling with ease.
Axios was employed to handle communication with the backend server, facilitating seamless CRUD operations. 
Real-time updates were achieved using Socket.IO, ensuring synchronized event changes across all users.
The app's dynamic modal for event details was implemented for enhanced user interaction. 
Additionally, authentication context was utilized to manage user-specific data and permissions effectively.
## Demo
https://github.com/aminhaghi86/school-full/assets/90243818/a230f59c-0f95-4477-9349-41adc7880e58

## Installation
* Clone the Repository

# Client-side 
```bash
  npm install
```
*create .env file and then 
```javascript
REACT_APP_ENDPOINT=http://'backend URL'/schedule  # Replace with your backend URL
REACT_APP_SOCKET_ENDPOINT=http://'backend URL'
paste your backend endpoint
```
_________

# server-side 
```bash
  npm install
```
create .env file in root and then paste below info!

```javascript
USERNAME1=''
PASSWORD=''
URL=localhost
PORT=''
DBNAME=''
JWT_SECRET=''
SERVERPORT=''
```
