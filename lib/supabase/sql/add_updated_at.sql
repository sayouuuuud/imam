-- 1. Create a function to handle updating the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add columns and triggers for sermons
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sermons' AND column_name = 'updated_at') THEN
        ALTER TABLE sermons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_sermons_modtime ON sermons;
CREATE TRIGGER update_sermons_modtime BEFORE UPDATE ON sermons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Add columns and triggers for lessons
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'updated_at') THEN
        ALTER TABLE lessons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_lessons_modtime ON lessons;
CREATE TRIGGER update_lessons_modtime BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Add columns and triggers for books
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'updated_at') THEN
        ALTER TABLE books ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_books_modtime ON books;
CREATE TRIGGER update_books_modtime BEFORE UPDATE ON books FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Add columns and triggers for articles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'updated_at') THEN
        ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_articles_modtime ON articles;
CREATE TRIGGER update_articles_modtime BEFORE UPDATE ON articles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
