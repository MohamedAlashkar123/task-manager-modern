-- =====================================================
-- Supabase Helper Functions for Task Manager
-- =====================================================

-- Function to increment display_order of all tasks
CREATE OR REPLACE FUNCTION increment_task_display_order()
RETURNS void AS $$
BEGIN
  UPDATE public.tasks 
  SET display_order = display_order + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk update task display orders
CREATE OR REPLACE FUNCTION bulk_update_task_order(updates jsonb)
RETURNS void AS $$
DECLARE
  update_record jsonb;
BEGIN
  FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE public.tasks 
    SET display_order = (update_record->>'display_order')::integer,
        updated_at = NOW()
    WHERE id = (update_record->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get tasks with proper ordering
CREATE OR REPLACE FUNCTION get_tasks_ordered()
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  completed boolean,
  status text,
  due_date date,
  display_order integer,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.priority, t.completed, t.status, 
         t.due_date, t.display_order, t.created_at, t.updated_at
  FROM public.tasks t
  ORDER BY 
    CASE t.priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
    END,
    t.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to reset display orders (maintenance)
CREATE OR REPLACE FUNCTION reset_task_display_orders()
RETURNS void AS $$
BEGIN
  WITH ordered_tasks AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
    FROM public.tasks
  )
  UPDATE public.tasks 
  SET display_order = ordered_tasks.new_order
  FROM ordered_tasks
  WHERE public.tasks.id = ordered_tasks.id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tasks by priority
CREATE OR REPLACE FUNCTION get_tasks_by_priority(task_priority text)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  completed boolean,
  status text,
  due_date date,
  display_order integer,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.priority, t.completed, t.status, 
         t.due_date, t.display_order, t.created_at, t.updated_at
  FROM public.tasks t
  WHERE t.priority = task_priority
  ORDER BY t.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to search tasks by title
CREATE OR REPLACE FUNCTION search_tasks(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  completed boolean,
  status text,
  due_date date,
  display_order integer,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.priority, t.completed, t.status, 
         t.due_date, t.display_order, t.created_at, t.updated_at
  FROM public.tasks t
  WHERE t.title ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE t.priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
    END,
    t.display_order ASC;
END;
$$ LANGUAGE plpgsql;