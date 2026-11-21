-- Which set of pages and editable content a site uses. This project has one
-- template, 'club', so every site hosted here uses it.
ALTER TABLE sites ADD COLUMN template TEXT NOT NULL DEFAULT 'club';
