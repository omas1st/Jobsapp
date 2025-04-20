const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');

// ----- ADMIN AUTHENTICATION MIDDLEWARE -----
function isAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
}

// ----------------------------
// Home & User Application Routes
// ----------------------------

// Home Page
router.get('/', (req, res) => {
  res.render('home');
});

router.post('/submit-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.redirect(`/status?email=${email}`);
    }
    const newUser = new User({ email });
    await newUser.save();
    req.session.email = email;
    res.redirect('/information');
  } catch (error) {
    console.error("Error submitting email:", error);
    res.status(500).send("Server error while submitting email, try again later.");
  }
});

// Information Page
router.get('/information', (req, res) => {
  res.render('information', { email: req.session.email });
});

router.post('/information', (req, res) => {
  const { agree, email } = req.body;
  if (!agree) {
    return res.send("You must agree to the terms and conditions.");
  }
  req.session.email = email;
  res.redirect('/jobform');
});

// Job Form Page
router.get('/jobform', (req, res) => {
  res.render('jobform', { email: req.session.email });
});

router.post('/jobform', async (req, res) => {
  try {
    const formData = req.body;
    const application = new Application({
      email: req.session.email,
      personalDetails: {
        fullName: formData.fullName,
        email: formData.email,
        whatsapp: formData.whatsapp,
        contact: formData.contact,
        country: formData.country,
      },
      jobDetails: {
        companyNames: formData.companyNames,
        companyLocation: formData.companyLocation,
        position: formData.position,
        jobType: formData.jobType,
      },
      status: 'Applied'
    });
    await application.save();
    res.redirect(`/status?email=${req.session.email}`);
  } catch (error) {
    console.error("Error submitting job form:", error);
    res.status(500).send("Server error while submitting job form, try again later.");
  }
});

// Application Status Page
router.get('/status', async (req, res) => {
  try {
    const { email } = req.query;
    const application = await Application.findOne({ email });
    if (!application) {
      return res.send("No application found for this email, kindly use another email to apply again.");
    }
    let message = "";
    if (application.status === 'Pending') {
      message = "Your application is pending. The management is working on your application. Please check back later (10 minutes to 24 hours).";
    } else if (application.status === 'Applied') {
      if (application.jobDetails.companyLocation === 'Online') {
        message = "Your application is successful, our management will message you for the inverview, and employment letter will be sent to your email/WhatsApp within 24 hours, then you can proceed to 'Task' on your dashboard to start your task.";
      } else {
        message = "Your application is successful, Employment letter will be sent to your email/whatsapp within 24 hours, then you can proceed to Travel Documents section on your dashboard to prepare your traveling documents.";
      }
    } else if (application.status === 'Declined') {
      message = "Your application is declined, kindly reapply for the job or another job, with different email";
    }
    res.render('status', { application, message });
  } catch (error) {
    console.error("Error loading status:", error);
    res.status(500).send("Server error while loading status, try again later.");
  }
});

// Chat Routes
router.get('/chat/whatsapp', (req, res) => {
  res.redirect("https://wa.me/12296726676");
});
router.get('/chat/email', (req, res) => {
  res.redirect("mailto:Omas7th@gmail.com");
});

// ----------------------------
// Admin Routes (with Authentication, Error Handling, & Search Functionality)
// ----------------------------

// Admin Login Page
router.get('/admin/login', (req, res) => {
  res.render('admin-login', { error: null });
});

// Admin Login Handler
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      req.session.admin = true;
      return res.redirect('/admin');
    } else {
      return res.render('admin-login', { error: 'Invalid credentials. Please try again.' });
    }
  } catch (error) {
    console.error("Error in admin login:", error);
    res.render('admin-login', { error: 'An error occurred. Please try again.' });
  }
});

// Admin Panel (Display Complete Application Details with Search)
router.get('/admin', isAdmin, async (req, res) => {
  try {
    let query = {};
    if (req.query.search) {
      query.email = { $regex: req.query.search, $options: 'i' };
    }
    const applications = await Application.find(query);
    res.render('admin', { applications, search: req.query.search || "" });
  } catch (error) {
    console.error("Error loading admin panel:", error);
    res.status(500).send("Error loading admin panel.");
  }
});

// Update Application Status and Admin Message
router.post('/admin/update-application', isAdmin, async (req, res) => {
  try {
    const { id, status, adminMessage } = req.body;
    if (!id || !status) {
      return res.status(400).send("Missing required fields.");
    }
    await Application.findByIdAndUpdate(id, { status, adminMessage });
    res.redirect('/admin');
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).send("Error updating application.");
  }
});

// Admin Logout
router.get('/admin/logout', isAdmin, (req, res) => {
  req.session.admin = false;
  res.redirect('/admin/login');
});

module.exports = router;
