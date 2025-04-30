const User = require('../models/User')
const { ApiResponse, ApiError } = require('../utils/response')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res, next) => {
  try {
    const { email, password, username } = req.body

    // Validate input
    if (!email || !password || !username) {
      throw new ApiError(400, 'Email, username, and password are required')
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new ApiError(400, 'Email already in use')
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json(new ApiResponse(201, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      },
      token
    }))

  } catch (error) {
    next(error)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required')
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json(new ApiResponse(200, {
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      },
      token
    }))

  } catch (error) {
    next(error)
  }
}

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    res.json(new ApiResponse(200, { user }))
  } catch (error) {
    next(error)
  }
}

exports.getAdminToken = async (req, res, next) => {
  try {
    const { adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Invalid admin secret' });
    }

    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
}
