const express = require("express");
const router = express.Router();

const allowedCategories = [
  "Roads & potholes", "Waste & sanitation", "Streetlights",
  "Water supply", "Public safety", "Parks & public spaces", "Other"
];
const clean = (value) => typeof value === "string" ? value.trim() : "";

router.get("/", async (req, res) => {
  const { data, error } = await req.supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ reports: data || [] });
});

router.post("/", async (req, res) => {
  const title = clean(req.body.title);
  const description = clean(req.body.description);
  const category = clean(req.body.category);
  const location = clean(req.body.location);
  const photo_url = clean(req.body.photo_url) || null;

  if (!title || !description || !category || !location) {
    return res.status(400).json({ error: "Title, category, location, and description are required." });
  }
  if (title.length > 100 || description.length > 1500 || location.length > 180) {
    return res.status(400).json({ error: "One or more fields exceed the allowed length." });
  }
  if (!allowedCategories.includes(category)) return res.status(400).json({ error: "Choose a valid category." });

  const { data, error } = await req.supabase.from("reports").insert({
    user_id: req.user.id, title, description, category, location, photo_url
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ report: data });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid report ID." });

  const title = clean(req.body.title);
  const description = clean(req.body.description);
  const category = clean(req.body.category);
  const location = clean(req.body.location);
  if (!title || !description || !category || !location) return res.status(400).json({ error: "All fields are required." });
  if (!allowedCategories.includes(category)) return res.status(400).json({ error: "Choose a valid category." });

  const { data, error } = await req.supabase.from("reports")
    .update({ title, description, category, location })
    .eq("id", id).select().maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Report not found or you do not have permission to edit it." });
  res.json({ report: data });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid report ID." });
  const { data, error } = await req.supabase.from("reports").delete().eq("id", id).select("id").maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Report not found or you do not have permission to delete it." });
  res.json({ message: "Report deleted successfully." });
});

module.exports = router;
