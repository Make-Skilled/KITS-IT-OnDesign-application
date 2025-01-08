const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());  // To parse JSON requests
app.use('/uploads', express.static('uploads')); // Serve static files from 'uploads' folder

// Setup for file uploads using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Store files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Unique filename
  }
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Course schema and model
const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  link: { type: String, required: true },
  image: { type: String }  // Store the filename or URL of the uploaded image
});

const Course = mongoose.model('Course', courseSchema);

// User schema and model
const userSchema = new mongoose.Schema({
    firstName: {type:String,required: true},
    lastName: {type:String,required: true},
    email: { type: String,required: true, unique: true },
    password: {type:String,required: true},  // No hashing
    country: {type:String,required: true}
});

const User = mongoose.model('User', userSchema);

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
});

const Job = mongoose.model('Job', jobSchema);

// POST route for user registration
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, country } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({ firstName, lastName, email, password, country });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST route for user login (without hashing)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords directly (without bcrypt)
        if (user.password !== password) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Return success message on successful login
        res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/ownerlogin', async (req, res) => {
    const { email, password } = req.body;
   
    // Hardcoded owner credentials
    const ownermail = "kits@gmail.com";
    const ownerpassword = "kits@2396";
   
    // Check if email matches
    if (email !== ownermail) {
      return res.status(400).json({ success: false, message: 'Owner not found' });
    }
   
    // Check if password matches
    if (password !== ownerpassword) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
   
    // Respond with success
    res.json({ success: true, message: 'Login successful'});
  });

app.post('/admincourses', upload.single('image'), async (req, res) => {
    const { name, description, price, link } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;  
  
    if (!name || !description || !price || !link) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    const newCourse = new Course({
      name,
      description,
      price,
      link,
      image,
    });
  
    try {
      await newCourse.save();
      res.status(201).json({ message: 'Course added successfully!' });
    } catch (error) {
      console.error('Error adding course:', error);
      res.status(500).json({ message: 'Error saving course' });
    }
  });


app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find();  
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});


app.post('/job-vacancies', async (req, res) => {
    const { title, description, location, salary } = req.body;

    if (!title || !description || !location || !salary) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const newJob = new Job({
        title,
        description,
        location,
        salary,
    });

    try {
        await newJob.save();
        res.status(201).json({ message: 'Job vacancy added successfully!' });
    } catch (error) {
        console.error('Error adding job vacancy:', error);
        res.status(500).json({ message: 'Error saving job vacancy' });
    }
});


app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find();
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching job vacancies:', error);
        res.status(500).json({ message: 'Error fetching job vacancies' });
    }
});


app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
