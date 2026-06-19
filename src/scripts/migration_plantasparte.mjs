import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: true
  });

  const connection = await pool.getConnection();

  try {
    console.log('--- STARTING MIGRATION ---');

    // 1. Create plantasparte table
    console.log('1. Creating table plantasparte...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plantasparte (
        idplantasparte INT(11) NOT NULL AUTO_INCREMENT,
        plantaspartenombre VARCHAR(255) NOT NULL,
        plantasparteemoji VARCHAR(50) DEFAULT '🌱',
        plantaspartedescripcion TEXT DEFAULT NULL,
        plantasparteactivo TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (idplantasparte),
        UNIQUE KEY uniq_nombre (plantaspartenombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Add column to datosadjuntos
    console.log('2. Adding column xdatosadjuntosidplantasparte to datosadjuntos...');
    const [columnsDA] = await connection.query("SHOW COLUMNS FROM datosadjuntos LIKE 'xdatosadjuntosidplantasparte'");
    if (columnsDA.length === 0) {
      await connection.query(`
        ALTER TABLE datosadjuntos 
        ADD COLUMN xdatosadjuntosidplantasparte INT(11) DEFAULT NULL,
        ADD CONSTRAINT fk_datosadjuntos_plantasparte 
        FOREIGN KEY (xdatosadjuntosidplantasparte) 
        REFERENCES plantasparte (idplantasparte) 
        ON DELETE SET NULL;
      `);
      console.log('Column and foreign key constraint added to datosadjuntos.');
    } else {
      console.log('Column xdatosadjuntosidplantasparte already exists in datosadjuntos.');
    }

    // 3. Add column to especiesconsumidores
    console.log('3. Adding column xespeciesconsumidoresidplantasparte to especiesconsumidores...');
    const [columnsEC] = await connection.query("SHOW COLUMNS FROM especiesconsumidores LIKE 'xespeciesconsumidoresidplantasparte'");
    if (columnsEC.length === 0) {
      await connection.query(`
        ALTER TABLE especiesconsumidores
        ADD COLUMN xespeciesconsumidoresidplantasparte INT(11) DEFAULT NULL,
        ADD CONSTRAINT fk_especiesconsumidores_plantasparte
        FOREIGN KEY (xespeciesconsumidoresidplantasparte)
        REFERENCES plantasparte (idplantasparte)
        ON DELETE RESTRICT;
      `);
      console.log('Column and foreign key constraint added to especiesconsumidores.');
    } else {
      console.log('Column xespeciesconsumidoresidplantasparte already exists in especiesconsumidores.');
    }

    // 4. Fetch existing data for migration
    console.log('4. Fetching existing especiesconsumidores records for migration...');
    const [rows] = await connection.query(`
      SELECT idespeciesconsumidores, xespeciesconsumidoresidespecies, xespeciesconsumidoresidconsumidores,
             especiesconsumidoresesapto, especiesconsumidorespartes, especiesconsumidoresnotas
      FROM especiesconsumidores
    `);

    console.log(`Found ${rows.length} rows to check.`);

    // Prepopulate standard plant parts to ensure they exist with nice emojis
    const defaultParts = [
      { nombre: 'Hojas', emoji: '🍃', desc: 'Hojas de la planta' },
      { nombre: 'Frutos', emoji: '🍅', desc: 'Frutos y bayas' },
      { nombre: 'Raíz', emoji: '🥕', desc: 'Raíces, bulbos y tubérculos' },
      { nombre: 'Tallo', emoji: '🪵', desc: 'Tallos, pencas y brotes tiernos' },
      { nombre: 'Flores', emoji: '🌸', desc: 'Flores e inflorescencias' },
      { nombre: 'Semillas', emoji: '🌾', desc: 'Semillas, granos y vainas' },
      { nombre: 'Toda la planta', emoji: '🌿', desc: 'Toda la planta' }
    ];

    for (const part of defaultParts) {
      await connection.query(`
        INSERT INTO plantasparte (plantaspartenombre, plantasparteemoji, plantaspartedescripcion, plantasparteactivo)
        VALUES (?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE plantaspartenombre=plantaspartenombre
      `, [part.nombre, part.emoji, part.desc]);
    }

    // Function to get or create a part and get its ID
    const getEmojiForPart = (name) => {
      const lower = name.toLowerCase();
      if (lower.includes('hoja') || lower.includes('follaje') || lower.includes('brote') || lower.includes('rama')) return '🍃';
      if (lower.includes('fruto') || lower.includes('fruta') || lower.includes('vaina')) return '🍅';
      if (lower.includes('raiz') || lower.includes('raíz') || lower.includes('tubérculo') || lower.includes('bulbo')) return '🥕';
      if (lower.includes('tallo') || lower.includes('penca') || lower.includes('madera')) return '🪵';
      if (lower.includes('flor') || lower.includes('inflorescencia')) return '🌸';
      if (lower.includes('semilla') || lower.includes('grano')) return '🌾';
      if (lower.includes('planta entera') || lower.includes('toda la planta') || lower.includes('planta')) return '🌿';
      if (lower.includes('corteza')) return '🪵';
      return '🌱';
    };

    const resolvePartId = async (partName) => {
      const trimmed = partName.trim();
      if (!trimmed) return null;

      // Try to find
      const [existing] = await connection.query(
        'SELECT idplantasparte FROM plantasparte WHERE LOWER(plantaspartenombre) = LOWER(?)',
        [trimmed]
      );

      if (existing.length > 0) {
        return existing[0].idplantasparte;
      }

      // Create new
      const emoji = getEmojiForPart(trimmed);
      const [insertResult] = await connection.query(
        'INSERT INTO plantasparte (plantaspartenombre, plantasparteemoji, plantaspartedescripcion, plantasparteactivo) VALUES (?, ?, ?, 1)',
        [trimmed, emoji, 'Creado automáticamente durante la migración de datos.']
      );
      console.log(`Created new plant part: "${trimmed}" with emoji ${emoji} (ID: ${insertResult.insertId})`);
      return insertResult.insertId;
    };

    // Drop old unique index that prevents multiple parts for same species/consumer
    // MySQL needs a key to support the foreign key constraint on xespeciesconsumidoresidespecies, so we create a temp key first
    console.log('Creating temporary index idx_temp_idespecies...');
    try {
      await connection.query('ALTER TABLE especiesconsumidores ADD KEY idx_temp_idespecies (xespeciesconsumidoresidespecies)');
      console.log('Temporary index created.');
    } catch (e) {
      console.log('Temporary index might already exist:', e.message);
    }

    console.log('Dropping old unique index idx_especie_consumidor...');
    try {
      await connection.query('ALTER TABLE especiesconsumidores DROP INDEX idx_especie_consumidor');
      console.log('Old unique index dropped.');
    } catch (e) {
      console.log('Could not drop index (might not exist or already dropped):', e.message);
    }

    // Begin transaction for data migration
    await connection.beginTransaction();

    try {
      for (const row of rows) {
        const rawPartes = row.especiesconsumidorespartes || '';
        if (!rawPartes.trim()) {
          // If empty, we can link to "Toda la planta" or leave it null. Let's link to NULL or "Toda la planta".
          // Let's keep it null.
          continue;
        }

        // Split by comma or slash or " y "
        const partsList = rawPartes
          .split(/,|\/|\by\b/i)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        if (partsList.length === 0) continue;

        // Resolve IDs
        const ids = [];
        for (const p of partsList) {
          const id = await resolvePartId(p);
          if (id) ids.push(id);
        }

        if (ids.length === 0) continue;

        // The first part updates the existing row
        await connection.query(
          'UPDATE especiesconsumidores SET xespeciesconsumidoresidplantasparte = ? WHERE idespeciesconsumidores = ?',
          [ids[0], row.idespeciesconsumidores]
        );

        // Subsequent parts require inserting new rows in especiesconsumidores
        for (let i = 1; i < ids.length; i++) {
          await connection.query(`
            INSERT INTO especiesconsumidores (
              xespeciesconsumidoresidespecies,
              xespeciesconsumidoresidconsumidores,
              especiesconsumidoresesapto,
              xespeciesconsumidoresidplantasparte,
              especiesconsumidoresnotas
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            row.xespeciesconsumidoresidespecies,
            row.xespeciesconsumidoresidconsumidores,
            row.especiesconsumidoresesapto,
            ids[i],
            row.especiesconsumidoresnotas || ''
          ]);
        }
      }

      await connection.commit();
      console.log('Data migration transaction successful!');

      // Create new unique index
      console.log('Adding new unique index idx_especie_consumidor_parte...');
      try {
        await connection.query('ALTER TABLE especiesconsumidores ADD UNIQUE KEY idx_especie_consumidor_parte (xespeciesconsumidoresidespecies, xespeciesconsumidoresidconsumidores, xespeciesconsumidoresidplantasparte)');
        console.log('New unique index added successfully.');
      } catch (e) {
        console.log('Could not add new unique index:', e.message);
      }

      // Drop temporary index
      console.log('Dropping temporary index idx_temp_idespecies...');
      try {
        await connection.query('ALTER TABLE especiesconsumidores DROP INDEX idx_temp_idespecies');
        console.log('Temporary index dropped successfully.');
      } catch (e) {
        console.log('Could not drop temporary index:', e.message);
      }
    } catch (migError) {
      await connection.rollback();
      throw migError;
    }

    // 5. Clean up: drop old text column
    console.log('5. Dropping column especiesconsumidorespartes from especiesconsumidores...');
    const [colsLeft] = await connection.query("SHOW COLUMNS FROM especiesconsumidores LIKE 'especiesconsumidorespartes'");
    if (colsLeft.length > 0) {
      await connection.query('ALTER TABLE especiesconsumidores DROP COLUMN especiesconsumidorespartes');
      console.log('Column especiesconsumidorespartes dropped successfully.');
    } else {
      console.log('Column especiesconsumidorespartes already dropped.');
    }

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');

  } catch (err) {
    console.error('--- MIGRATION FAILED ---');
    console.error(err);
  } finally {
    connection.release();
    await pool.end();
  }
}

run();
