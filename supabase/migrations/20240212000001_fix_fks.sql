DO $$
DECLARE
    con_name text;
BEGIN
    -- reviews.customer_id
    SELECT constraint_name INTO con_name 
    FROM information_schema.key_column_usage 
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'customer_id'
    LIMIT 1;

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.reviews DROP CONSTRAINT ' || quote_ident(con_name);
    END IF;

    -- messages.sender_id
    SELECT constraint_name INTO con_name 
    FROM information_schema.key_column_usage 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id'
    LIMIT 1;

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.messages DROP CONSTRAINT ' || quote_ident(con_name);
    END IF;

    -- messages.receiver_id
    SELECT constraint_name INTO con_name 
    FROM information_schema.key_column_usage 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'receiver_id'
    LIMIT 1;

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.messages DROP CONSTRAINT ' || quote_ident(con_name);
    END IF;

    -- payouts.user_id
    SELECT constraint_name INTO con_name 
    FROM information_schema.key_column_usage 
    WHERE table_schema = 'public' AND table_name = 'payouts' AND column_name = 'user_id'
    LIMIT 1;

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.payouts DROP CONSTRAINT ' || quote_ident(con_name);
    END IF;
END $$;

-- Re-add constraints pointing to public.users
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);

ALTER TABLE public.messages 
ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);

ALTER TABLE public.payouts 
ADD CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
