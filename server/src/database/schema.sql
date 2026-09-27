-- =============================================================
-- Recipe App — Phase 1 Database Schema
-- =============================================================

-- -------------------------------------------------------------
-- TABLE: users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL UNIQUE,
    password_hash   TEXT        NOT NULL,
    target_calories NUMERIC(8,2),
    target_protein  NUMERIC(8,2),
    target_carbs    NUMERIC(8,2),
    target_fat      NUMERIC(8,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- TABLE: ingredients
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              TEXT         NOT NULL UNIQUE,
    calories_per_100g NUMERIC(8,2) NOT NULL,
    protein_per_100g  NUMERIC(8,2) NOT NULL,
    carbs_per_100g    NUMERIC(8,2) NOT NULL,
    fat_per_100g      NUMERIC(8,2) NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- TABLE: recipes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT,
    instructions TEXT,
    servings    INTEGER     NOT NULL CHECK (servings > 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- TABLE: recipe_ingredients
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipe_id       INTEGER      NOT NULL,
    ingredient_id   INTEGER      NOT NULL,
    quantity_grams  NUMERIC(10,2) NOT NULL CHECK (quantity_grams > 0),

    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipe_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_recipe_ingredients_recipe_ingredient
        UNIQUE (recipe_id, ingredient_id)
);

-- Indexes for recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
    ON recipe_ingredients (recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id
    ON recipe_ingredients (ingredient_id);

-- -------------------------------------------------------------
-- TABLE: user_pantry
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_pantry (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        INTEGER      NOT NULL,
    ingredient_id  INTEGER      NOT NULL,
    quantity_grams NUMERIC(10,2) NOT NULL CHECK (quantity_grams > 0),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_pantry_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_pantry_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_pantry_user_ingredient
        UNIQUE (user_id, ingredient_id)
);

-- Indexes for user_pantry
CREATE INDEX IF NOT EXISTS idx_user_pantry_user_id
    ON user_pantry (user_id);

CREATE INDEX IF NOT EXISTS idx_user_pantry_ingredient_id
    ON user_pantry (ingredient_id);
