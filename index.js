const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
 
const app = express();
app.use(express.json());
 
const secretKey = 'secret_key'; 
 
// Sample users data
const users = [
  { username: 'admin', password: 'admin123', userType: 'admin' },
  { username: 'user', password: 'user123', userType: 'regular' }
];
 

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  

  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
 
  
  const token = jwt.sign({ username: user.username, userType: user.userType }, secretKey);
  
  res.json({ token });
});
 
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'].split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Token is required' });
  }
 
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};
 
// Home endpoint
app.get('/home', verifyToken, (req, res) => {
  const userType = req.user.userType;
  let books = [];
  
  if (userType === 'regular') {

    books = fs.readFileSync('regularUser.csv', 'utf8').split('\n').map(row => row.trim()).filter(Boolean);
  } else if (userType === 'admin') {

    books = fs.readFileSync('regularUser.csv', 'utf8').split('\n').map(row => row.trim()).filter(Boolean);
    const adminBooks = fs.readFileSync('adminUser.csv', 'utf8').split('\n').map(row => row.trim()).filter(Boolean);
    books = books.concat(adminBooks);
  }
 
  res.json({ books });
});
 
// Add Book endpoint
app.post('/addBook', verifyToken, (req, res) => {
  const { bookName, author, publicationYear } = req.body;
  
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Only admin users can add books' });
  }
 
 
  if (typeof bookName !== 'string' || typeof author !== 'string' || typeof publicationYear !== 'number' || isNaN(publicationYear)) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }
 

  fs.appendFileSync('regularUser.csv', `${bookName},${author},${publicationYear}\n`);
  
  res.json({ message: 'Book added successfully' });
});
 
// Delete Book endpoint
app.delete('/deleteBook/:bookName', verifyToken, (req, res) => {
  const bookName = req.params.bookName.toLowerCase();
  
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Only admin users can delete books' });
  }
 
 
  let books = fs.readFileSync('regularUser.csv', 'utf8').split('\n');
  

  const index = books.findIndex(book => book.toLowerCase().startsWith(bookName));
  
  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }
 

  books.splice(index, 1);
  

  fs.writeFileSync('regularUser.csv', books.join('\n'));
  
  res.json({ message: 'Book deleted successfully' });
});
 
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});