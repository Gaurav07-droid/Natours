const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name.email,photo,passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],

    maxLength: [15, 'A name must be less than or equal to 15 characters'],
    minLength: [2, 'A name must have atleast 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide valid email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter password'],
    // validate: [validator.isStrongPassword, 'Please enter strong password'],
    minLength: [8, 'password must be 8 characters long'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      //THIS ONLY WORKS create Or SAVE!!!  use.create()user.save()
      validator: function (el) {
        return el === this.password;
      },
      message: "Password dosen't match",
    },
  },
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpiresIn: Date,
  active: { type: Boolean, default: true, select: false },
});

//Hashing the password
userSchema.pre('save', async function (next) {
  //only run this if password was modified
  if (!this.isModified('password')) return next();

  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); //12 is called salt here

  //delete password comfirm
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//defining thid function on schema so it will be available on every user object
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.ChangedPasswordAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTtimestamp);

    return JWTtimestamp < changedTimeStamp; //if jwtTimeStamp<changedTimeStamp return true
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpiresIn = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
