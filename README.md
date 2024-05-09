# School-fullStack
I developed this application using React for the frontend, integrating FullCalendar to manage event scheduling with ease.
Axios was employed to handle communication with the backend server, facilitating seamless CRUD operations. 
Real-time updates were achieved using Socket.IO, ensuring synchronized event changes across all users.
The app's dynamic modal for event details was implemented for enhanced user interaction. 
Additionally, authentication context was utilized to manage user-specific data and permissions effectively.
## Demo
<img width="1512" alt="Screenshot 2024-05-09 at 13 39 55" src="https://github.com/aminhaghi86/school-full/assets/90243818/9dd789b8-df1b-4c4d-b843-d3082d1722c3">
<img width="1512" alt="Screenshot 2024-05-09 at 13 40 24" src="https://github.com/aminhaghi86/school-full/assets/90243818/c077643f-b6a1-4614-a22d-83f9d5e0c3ed">

https://github.com/aminhaghi86/school-full/assets/90243818/36cbff62-ab97-4200-8019-998c2e76a25b


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
