const supabase = require('../config/supabase');

exports.getCalls = async (req, res) => {
  const { data, error } = await supabase.from('calls').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.createCall = async (req, res) => {
  const { elder_id, caregiver_id } = req.body;
  const { data, error } = await supabase.from('calls').insert([{ elder_id, caregiver_id }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
}; 