-- Seed Profiles matching existing frontend mock store
INSERT INTO profiles (id, email, full_name, role, status, wallet_balance, reward_points, is_active, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
('u_admin', 'admin@campus.edu', 'System Admin', 'ADMIN', 'ACTIVE', 1000.00, 100, 1, 0, NOW(), NOW(), 'system', 'system'),
('u_faculty', 'faculty@campus.edu', 'Dr. Sarah Smith', 'PROFESSOR', 'ACTIVE', 500.00, 50, 1, 0, NOW(), NOW(), 'system', 'system'),
('u_student', 'student@campus.edu', 'Alex Johnson', 'STUDENT', 'ACTIVE', 750.00, 150, 1, 0, NOW(), NOW(), 'system', 'system'),
('u_librarian', 'librarian@campus.edu', 'Emily Book', 'LIBRARIAN', 'ACTIVE', 250.00, 20, 1, 0, NOW(), NOW(), 'system', 'system'),
('u_canteen', 'canteen@campus.edu', 'Chef Mario', 'CANTEEN_STAFF', 'ACTIVE', 300.00, 30, 1, 0, NOW(), NOW(), 'system', 'system');

-- Seed Books
INSERT INTO books (id, title, author, category, isbn, total_copies, available_copies, location, description, cover_url, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
('b1', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science', '9780262033848', 5, 5, 'Shelf A1', 'A comprehensive guide to algorithm design and analysis.', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system'),
('b2', 'Clean Code', 'Robert C. Martin', 'Software Engineering', '9780132350884', 3, 3, 'Shelf A2', 'A handbook of agile software craftsmanship.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system'),
('b3', 'The Pragmatic Programmer', 'Andrew Hunt', 'Software Engineering', '9780135957059', 4, 4, 'Shelf B1', 'Your journey to mastery in software development.', 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system');

-- Seed Canteen Menu Items
INSERT INTO menu_items (id, name, category, price, is_available, description, image_url, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
('m1', 'Hot Cappuccino', 'BEVERAGES', 60.00, 1, 'Rich espresso with steamed milk foam.', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system'),
('m2', 'Veggie Cheese Burger', 'SNACKS', 90.00, 1, 'Crispy patty with fresh cheese and vegetables.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system'),
('m3', 'North Indian Thali', 'MEALS', 150.00, 1, 'Roti, rice, dal, paneer, and sweets.', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system'),
('m4', 'Chocolate Brownie', 'DESSERTS', 80.00, 1, 'Warm fudge brownie topped with chocolate syrup.', 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&q=80&w=400', 0, NOW(), NOW(), 'system', 'system');

-- Seed Campus Facilities
INSERT INTO facilities (id, name, type, description, capacity, location, hourly_rate, image_url, created_at, updated_at, created_by, updated_by) VALUES
('f1', 'Main Seminar Hall', 'SEMINAR_HALL', 'Equipped with sound system and projector.', 120, 'Block A, 2nd Floor', 200.00, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400', NOW(), NOW(), 'system', 'system'),
('f2', 'Advanced Computer Lab', 'LAB', 'Equipped with 30 high-performance computer units.', 30, 'Block B, 3rd Floor', 150.00, 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=400', NOW(), NOW(), 'system', 'system'),
('f3', 'Football Ground', 'SPORTS_GROUND', 'Full size outdoor sports ground.', 500, 'Behind block C', 100.00, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400', NOW(), NOW(), 'system', 'system');

-- Seed Forums
INSERT INTO forums (id, title, description, category, created_at, updated_at, created_by, updated_by) VALUES
('fr1', 'General University Discussions', 'Talk about general campus life and announcements.', 'General', NOW(), NOW(), 'u_admin', 'u_admin'),
('fr2', 'Coding Clubs & Tech', 'Discussion board for programming contests and hacks.', 'Technology', NOW(), NOW(), 'u_faculty', 'u_faculty');

-- Seed Forum Posts
INSERT INTO forum_posts (id, forum_id, content, created_at, updated_at, created_by, updated_by) VALUES
('p1', 'fr1', 'Welcome to the Campus Connect official community boards!', NOW(), NOW(), 'u_admin', 'u_admin'),
('p2', 'fr2', 'Anyone interested in the upcoming college hackathon?', NOW(), NOW(), 'u_student', 'u_student');
