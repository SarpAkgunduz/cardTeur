const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: String,
  jerseyNumber: Number,
  preferredPosition: {
    type: String,
    enum: ['GK', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', "LM", "RM"],
  },
  marketValue: Number,
  cardImage: String,
  cardTitle: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'platinum'],
  },


  //!!!!!TO DO: Check the fields if it matches the database
  //!!!!!TO DO: Check the fields if it matches the database
  //!!!!!TO DO: Check the fields if it matches the database

  // Overalls
  offensiveOverall: Number,
  defensiveOverall: Number,
  athleticismOverall: Number,

  // Sub-stats (Offensive)
  dribbling: Number,
  shotAccuracy: Number,
  shotSpeed: Number,
  headers: Number,
  shortPass: Number,
  longPass: Number,
  ballControl: Number,
  positioning: Number,
  vision: Number,
  // Sub-stats (Defensive)
  tackling: Number,
  interceptions: Number,
  marking: Number,
  defensiveIQ: Number,
  // Sub-stats (Athleticism)
  speed: Number,
  strength: Number,
  stamina: Number,
});

module.exports = mongoose.model('Player', PlayerSchema);
