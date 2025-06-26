const supabase = require('../config/supabase');

exports.getElders = async (req, res) => {
  const { data, error } = await supabase.from('elders').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.createElder = async (req, res) => {
  const { full_name, phone_number, timezone, voice_preference } = req.body;
  const { data, error } = await supabase
    .from('elders')
    .insert([{ full_name, phone_number, timezone, voice_preference }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (Array.isArray(data) && data.length > 0) {
    res.status(201).json(data[0]);
  } else {
    res.status(201).json({ message: 'Elder created, but no data returned.' });
  }
}; 