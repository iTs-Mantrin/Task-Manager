const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Planning',
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    },
    teams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    }],
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    startDate: Date,
    dueDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ teams: 1, status: 1 });
projectSchema.index({ members: 1 });

module.exports = mongoose.model('Project', projectSchema);
