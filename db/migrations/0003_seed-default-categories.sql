-- Custom SQL migration file, put your code below! --
INSERT INTO categories (user_id, name)
VALUES
  (NULL, 'Dress'),
  (NULL, 'Top'),
  (NULL, 'Pants'),
  (NULL, 'Skirt'),
  (NULL, 'Shorts'),
  (NULL, 'Jacket'),
  (NULL, 'Coat'),
  (NULL, 'Jumper'),
  (NULL, 'Cardigan'),
  (NULL, 'Shoes'),
  (NULL, 'Accessory'),
  (NULL, 'Other')
ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;