const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: String,
  cardImage: String,
  cardTitle: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'platinum'],
  },
  // Overalls
  offensiveOverall: Number,
  defensiveOverall: Number,
  athleticismOverall: Number,

  // Sub-stats (Offensive)
  dribbling: Number,
  shotAccuracy: Number,
  shotSpeed: Number,
  shortPass: Number,
  longPass: Number,
  ballControl: Number,
  finishing: Number,
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
