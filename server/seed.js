import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop tables in reverse dependency order
    await client.query(`
      DROP TABLE IF EXISTS compliance_records CASCADE;
      DROP TABLE IF EXISTS cost_analyses CASCADE;
      DROP TABLE IF EXISTS batch_schedules CASCADE;
      DROP TABLE IF EXISTS recipes CASCADE;
      DROP TABLE IF EXISTS quality_records CASCADE;
      DROP TABLE IF EXISTS environment_controls CASCADE;
      DROP TABLE IF EXISTS contamination_records CASCADE;
      DROP TABLE IF EXISTS yield_predictions CASCADE;
      DROP TABLE IF EXISTS nutrient_media CASCADE;
      DROP TABLE IF EXISTS fermentation_processes CASCADE;
      DROP TABLE IF EXISTS strains CASCADE;
      DROP TABLE IF EXISTS bioreactors CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'operator',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE fermentation_processes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        organism VARCHAR(255),
        substrate VARCHAR(255),
        target_product VARCHAR(255),
        temperature DECIMAL(5,2),
        ph_level DECIMAL(4,2),
        duration_hours INTEGER,
        status VARCHAR(50) DEFAULT 'planned',
        yield_percentage DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE strains (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        organism_type VARCHAR(255),
        source VARCHAR(255),
        genetic_modifications TEXT,
        optimal_temp DECIMAL(5,2),
        optimal_ph DECIMAL(4,2),
        growth_rate DECIMAL(5,3),
        product_yield DECIMAL(5,2),
        resistance_markers VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE nutrient_media (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        base_type VARCHAR(255),
        carbon_source VARCHAR(255),
        nitrogen_source VARCHAR(255),
        minerals TEXT,
        vitamins TEXT,
        ph_target DECIMAL(4,2),
        sterilization_method VARCHAR(100),
        cost_per_liter DECIMAL(10,2),
        shelf_life_days INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE yield_predictions (
        id SERIAL PRIMARY KEY,
        process_name VARCHAR(255),
        strain_name VARCHAR(255),
        predicted_yield DECIMAL(5,2),
        actual_yield DECIMAL(5,2),
        confidence_score DECIMAL(4,2),
        parameters_json JSONB,
        prediction_date TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE contamination_records (
        id SERIAL PRIMARY KEY,
        process_name VARCHAR(255),
        contaminant_type VARCHAR(255),
        detection_method VARCHAR(255),
        severity VARCHAR(50) DEFAULT 'low',
        action_taken TEXT,
        resolved BOOLEAN DEFAULT false,
        detection_date TIMESTAMP DEFAULT NOW(),
        resolution_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE bioreactors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        capacity_liters DECIMAL(10,2),
        material VARCHAR(100),
        status VARCHAR(50) DEFAULT 'available',
        current_process VARCHAR(255),
        installation_date DATE,
        last_maintenance DATE,
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE environment_controls (
        id SERIAL PRIMARY KEY,
        bioreactor_id INTEGER REFERENCES bioreactors(id) ON DELETE SET NULL,
        parameter_name VARCHAR(255),
        set_value DECIMAL(10,3),
        actual_value DECIMAL(10,3),
        unit VARCHAR(50),
        tolerance DECIMAL(10,3),
        status VARCHAR(50) DEFAULT 'normal',
        last_updated TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE quality_records (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(100),
        product_name VARCHAR(255),
        test_type VARCHAR(255),
        test_result DECIMAL(10,4),
        specification_min DECIMAL(10,4),
        specification_max DECIMAL(10,4),
        unit VARCHAR(50),
        passed BOOLEAN DEFAULT true,
        tested_by VARCHAR(255),
        test_date TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE recipes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        product_type VARCHAR(255),
        strain_name VARCHAR(255),
        media_name VARCHAR(255),
        fermentation_type VARCHAR(50) DEFAULT 'batch',
        duration_hours INTEGER,
        temperature DECIMAL(5,2),
        ph_level DECIMAL(4,2),
        agitation_rpm INTEGER,
        aeration_rate DECIMAL(5,2),
        steps_json JSONB,
        status VARCHAR(50) DEFAULT 'draft',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE batch_schedules (
        id SERIAL PRIMARY KEY,
        batch_name VARCHAR(255) NOT NULL,
        recipe_name VARCHAR(255),
        bioreactor_name VARCHAR(255),
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'scheduled',
        assigned_to VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE compliance_records (
        id SERIAL PRIMARY KEY,
        regulation_name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        requirement TEXT,
        status VARCHAR(50) DEFAULT 'pending_review',
        due_date TIMESTAMP,
        assigned_to VARCHAR(255),
        evidence TEXT,
        last_audit_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE cost_analyses (
        id SERIAL PRIMARY KEY,
        batch_name VARCHAR(255),
        raw_material_cost DECIMAL(10,2),
        labor_cost DECIMAL(10,2),
        energy_cost DECIMAL(10,2),
        equipment_cost DECIMAL(10,2),
        overhead_cost DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        revenue DECIMAL(10,2),
        profit_margin DECIMAL(5,2),
        currency VARCHAR(10) DEFAULT 'USD',
        analysis_date TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('demo@fermentation.ai', $1, 'Demo User', 'admin'),
      ('operator1@fermentation.ai', $1, 'Sarah Chen', 'operator'),
      ('operator2@fermentation.ai', $1, 'Marcus Williams', 'operator'),
      ('scientist1@fermentation.ai', $1, 'Dr. Elena Vasquez', 'scientist'),
      ('scientist2@fermentation.ai', $1, 'Dr. Raj Patel', 'scientist'),
      ('manager@fermentation.ai', $1, 'James Thornton', 'manager')
    `, [hashedPassword]);

    // Seed fermentation processes
    await client.query(`
      INSERT INTO fermentation_processes (name, organism, substrate, target_product, temperature, ph_level, duration_hours, status, yield_percentage, notes) VALUES
      ('Whey Protein Production Run A', 'Trichoderma reesei', 'Glucose syrup', 'Beta-lactoglobulin', 30.0, 5.5, 72, 'running', 78.5, 'Primary whey protein production using optimized T. reesei strain'),
      ('Casein Synthesis Batch 12', 'Pichia pastoris', 'Glycerol', 'Alpha-s1-casein', 28.0, 6.0, 96, 'completed', 82.3, 'High-yield casein production for cheese alternative applications'),
      ('Heme Protein Fermentation', 'Komagataella phaffii', 'Methanol/Glycerol', 'Leghemoglobin', 25.0, 6.5, 120, 'running', 65.0, 'Soy leghemoglobin for plant-based meat color and flavor'),
      ('Lipase Enzyme Production', 'Aspergillus niger', 'Corn starch', 'Lipase', 35.0, 4.5, 48, 'completed', 91.2, 'Industrial lipase for dairy-free cheese ripening'),
      ('Vitamin B12 Synthesis', 'Pseudomonas denitrificans', 'Sucrose', 'Cyanocobalamin', 30.0, 7.0, 168, 'running', 45.8, 'B12 production for nutritional supplement fortification'),
      ('Collagen Type I Production', 'Pichia pastoris', 'Glucose', 'Recombinant collagen', 28.0, 5.8, 144, 'planned', null, 'Animal-free collagen for cosmetics and food applications'),
      ('Mycoprotein Biomass Growth', 'Fusarium venenatum', 'Glucose syrup', 'Mycoprotein', 28.0, 6.2, 36, 'completed', 88.7, 'Continuous mycoprotein production for meat alternatives'),
      ('Rennet Chymosin Production', 'Aspergillus niger var. awamori', 'Maltodextrin', 'Chymosin', 33.0, 5.0, 60, 'completed', 85.1, 'Microbial rennet for vegetarian cheese production'),
      ('Insulin Precursor Batch', 'Saccharomyces cerevisiae', 'Glucose', 'Insulin precursor', 30.0, 5.5, 72, 'running', 70.2, 'Recombinant insulin precursor for pharmaceutical applications'),
      ('Lactoferrin Expression', 'Aspergillus oryzae', 'Rice starch', 'Lactoferrin', 30.0, 6.0, 96, 'planned', null, 'Human lactoferrin analog for infant formula fortification'),
      ('Cellulase Complex Production', 'Trichoderma reesei', 'Cellulose', 'Cellulase', 28.0, 4.8, 120, 'completed', 76.4, 'Multi-enzyme cellulase complex for biomass processing'),
      ('Egg White Ovalbumin', 'Pichia pastoris', 'Methanol', 'Ovalbumin', 25.0, 6.3, 84, 'running', 58.9, 'Animal-free egg white protein for baking applications'),
      ('Pea Hemoglobin Synthesis', 'E. coli BL21', 'LB + IPTG', 'Pea hemoglobin', 37.0, 7.2, 24, 'completed', 55.3, 'Hemoglobin for plant-based meat flavoring'),
      ('Natamycin Production', 'Streptomyces natalensis', 'Glucose/Soybean meal', 'Natamycin', 26.0, 7.0, 144, 'planned', null, 'Natural food preservative antifungal agent'),
      ('Protease Enzyme Batch', 'Bacillus licheniformis', 'Soy flour', 'Alkaline protease', 37.0, 8.5, 48, 'completed', 92.0, 'Industrial protease for food protein hydrolysis')
    `);

    // Seed strains
    await client.query(`
      INSERT INTO strains (name, organism_type, source, genetic_modifications, optimal_temp, optimal_ph, growth_rate, product_yield, resistance_markers, status, notes) VALUES
      ('TR-RUT-C30', 'Fungus', 'ATCC Culture Collection', 'Catabolite derepressed mutant, enhanced cellulase secretion', 28.0, 4.8, 0.180, 85.5, 'Hygromycin B', 'active', 'Industry standard cellulase producer, well-characterized'),
      ('PP-GS115-hLF', 'Yeast', 'In-house engineering', 'Human lactoferrin gene insertion via pPIC9K vector', 28.0, 6.0, 0.250, 72.0, 'Geneticin G418', 'active', 'Optimized for lactoferrin secretion with AOX1 promoter'),
      ('PP-X33-BLG', 'Yeast', 'In-house engineering', 'Beta-lactoglobulin gene codon-optimized for Pichia', 28.0, 5.5, 0.220, 78.5, 'Zeocin', 'active', 'Whey protein production strain with high secretion titer'),
      ('AN-NRRL3122', 'Fungus', 'USDA NRRL Collection', 'Wild-type with UV mutagenesis for enhanced lipase', 35.0, 4.5, 0.150, 91.0, 'None', 'active', 'High lipase producer, food-grade GRAS status'),
      ('SC-INS-7', 'Yeast', 'In-house engineering', 'Alpha-factor signal sequence, insulin precursor fusion', 30.0, 5.5, 0.350, 70.0, 'URA3, LEU2', 'testing', 'Insulin precursor production under GAL1 promoter'),
      ('EC-BL21-LEGH', 'Bacterium', 'Commercial (NEB)', 'pET28a-leghemoglobin, T7 promoter system', 37.0, 7.0, 0.800, 55.0, 'Kanamycin', 'active', 'High-expression leghemoglobin for plant-based meat'),
      ('FV-QUORN-A3', 'Fungus', 'Licensed strain', 'Adapted for continuous glucose-fed fermentation', 28.0, 6.2, 0.200, 88.0, 'None', 'active', 'Mycoprotein biomass production, food-grade certified'),
      ('PD-MB580', 'Bacterium', 'DSMZ Collection', 'Enhanced cobalt transporter, optimized B12 pathway', 30.0, 7.0, 0.450, 45.0, 'Tetracycline', 'active', 'Vitamin B12 overproducer with 5x wild-type yield'),
      ('AO-RIB40-COL', 'Fungus', 'ATCC Culture Collection', 'Recombinant human collagen III gene, amyB promoter', 30.0, 5.8, 0.120, 42.0, 'Pyrithiamine', 'testing', 'Collagen III production for tissue engineering'),
      ('KP-CBS7435-OVA', 'Yeast', 'In-house engineering', 'Ovalbumin gene with native signal peptide', 25.0, 6.3, 0.280, 60.0, 'Zeocin', 'active', 'Egg white ovalbumin for food applications'),
      ('SN-ATCC27448', 'Bacterium', 'ATCC Culture Collection', 'Random mutagenesis for enhanced natamycin titer', 26.0, 7.0, 0.100, 68.0, 'Thiostrepton', 'active', 'Natamycin antifungal production strain'),
      ('BL-ATCC14580', 'Bacterium', 'ATCC Culture Collection', 'Protease gene amplification via multi-copy integration', 37.0, 8.5, 0.650, 92.0, 'Chloramphenicol', 'active', 'Alkaline protease hyperproducer, GRAS organism'),
      ('AN-AW-CHY', 'Fungus', 'Licensed strain', 'Bovine chymosin gene, glucoamylase promoter', 33.0, 5.0, 0.140, 85.0, 'AmdS', 'active', 'FDA-approved recombinant chymosin producer'),
      ('PP-MUT-CAS', 'Yeast', 'In-house engineering', 'Alpha-s1-casein with Kex2 cleavage site', 28.0, 6.0, 0.230, 82.0, 'HIS4', 'active', 'Casein production for dairy alternative applications'),
      ('TR-QM6a-EG2', 'Fungus', 'QM lineage', 'Enhanced endoglucanase II expression, cbh1 promoter', 28.0, 5.0, 0.170, 79.0, 'Hygromycin B', 'active', 'Specialized cellulase for biomass saccharification')
    `);

    // Seed nutrient media
    await client.query(`
      INSERT INTO nutrient_media (name, base_type, carbon_source, nitrogen_source, minerals, vitamins, ph_target, sterilization_method, cost_per_liter, shelf_life_days, status, notes) VALUES
      ('BMGY Growth Medium', 'Complex', 'Glycerol (10 g/L)', 'Yeast extract + Peptone', 'YNB with ammonium sulfate', 'Biotin (4x10-5%)', 6.0, 'Autoclave 121C 20min', 12.50, 30, 'active', 'Buffered growth medium for Pichia pastoris biomass accumulation'),
      ('BMMY Induction Medium', 'Complex', 'Methanol (0.5%)', 'Yeast extract + Peptone', 'YNB with ammonium sulfate', 'Biotin (4x10-5%)', 6.0, 'Autoclave 121C 20min', 14.80, 30, 'active', 'Methanol induction medium for AOX1 promoter activation'),
      ('Mandels-Andreotti Medium', 'Defined', 'Cellulose/Lactose (10 g/L)', 'Ammonium sulfate + Urea', 'KH2PO4, MgSO4, CaCl2, FeSO4, MnSO4, ZnSO4, CoCl2', 'None', 4.8, 'Autoclave 121C 20min', 8.30, 60, 'active', 'Standard cellulase production medium for Trichoderma'),
      ('Corn Steep Liquor Medium', 'Complex', 'Glucose (40 g/L)', 'Corn steep liquor (20 g/L)', 'KH2PO4, MgSO4, CaCl2', 'Natural B-vitamins from CSL', 5.0, 'Autoclave 121C 30min', 5.20, 45, 'active', 'Low-cost industrial medium for fungal enzyme production'),
      ('LB + IPTG Induction', 'Complex', 'Tryptone (10 g/L)', 'Yeast extract (5 g/L)', 'NaCl (10 g/L)', 'None', 7.0, 'Autoclave 121C 20min', 6.80, 30, 'active', 'Standard E. coli expression medium with 0.5mM IPTG induction'),
      ('Defined Mineral Medium', 'Defined', 'Glucose (20 g/L)', 'Ammonium chloride (5 g/L)', 'KH2PO4, MgSO4, CaCl2, trace elements', 'Thiamine HCl (1 mg/L)', 7.0, 'Filter sterilization 0.2um', 9.50, 90, 'active', 'Chemically defined medium for reproducible fermentation studies'),
      ('Soybean Meal Medium', 'Complex', 'Glucose (30 g/L)', 'Soybean meal (15 g/L)', 'KH2PO4, MgSO4, NaCl', 'Natural from soybean', 7.0, 'Autoclave 121C 25min', 4.10, 45, 'active', 'Cost-effective medium for Streptomyces natamycin production'),
      ('YPD Rich Medium', 'Complex', 'Dextrose (20 g/L)', 'Yeast extract (10g/L) + Peptone (20g/L)', 'Trace elements from yeast extract', 'B-vitamins from yeast extract', 6.5, 'Autoclave 121C 20min', 7.90, 30, 'active', 'Universal rich medium for yeast growth and maintenance'),
      ('Fed-Batch Glucose Feed', 'Defined', 'Glucose (500 g/L concentrate)', 'None (supplement separately)', 'None', 'None', 5.5, 'Autoclave 121C 30min', 3.20, 120, 'active', 'Concentrated glucose feed solution for fed-batch operations'),
      ('Pichia Basal Salts', 'Defined', 'Glycerol (40 g/L)', 'NH4OH (pH control)', 'H3PO4, CaSO4, K2SO4, MgSO4, KOH', 'PTM1 trace salts + Biotin', 5.0, 'Autoclave components separately', 11.40, 60, 'active', 'High-cell-density Pichia fermentation basal medium'),
      ('TB Terrific Broth', 'Complex', 'Glycerol (4 mL/L)', 'Tryptone (12g/L) + Yeast extract (24g/L)', 'KH2PO4, K2HPO4', 'Natural from yeast extract', 7.2, 'Autoclave 121C 20min', 8.60, 30, 'active', 'High-density E. coli growth medium for recombinant protein'),
      ('Czapek-Dox Modified', 'Defined', 'Sucrose (30 g/L)', 'Sodium nitrate (3 g/L)', 'KH2PO4, MgSO4, KCl, FeSO4', 'None', 5.5, 'Autoclave 121C 20min', 6.30, 90, 'active', 'Modified Czapek medium for Aspergillus enzyme production'),
      ('Mushroom Extract Medium', 'Complex', 'Glucose (20 g/L)', 'Mushroom extract (10 g/L)', 'MgSO4, KH2PO4, trace elements', 'B1, B2, B6 from extract', 6.0, 'Autoclave 121C 20min', 15.70, 21, 'active', 'Specialized medium for mycoprotein flavor development'),
      ('Whey Permeate Medium', 'Complex', 'Lactose from whey (40 g/L)', 'Whey protein remnants', 'Natural minerals from whey', 'Riboflavin, B12 traces', 5.5, 'Pasteurization 72C 15min', 2.80, 14, 'active', 'Upcycled dairy waste as low-cost fermentation substrate'),
      ('Production Scale Medium 7', 'Complex', 'Glucose/Fructose (50 g/L)', 'Yeast extract (15g/L) + (NH4)2SO4 (5g/L)', 'Comprehensive trace element solution', 'Biotin + Thiamine', 5.8, 'In-situ sterilization 130C 20min', 6.90, 45, 'active', 'Optimized production-scale medium for recombinant protein')
    `);

    // Seed yield predictions
    await client.query(`
      INSERT INTO yield_predictions (process_name, strain_name, predicted_yield, actual_yield, confidence_score, parameters_json, status, notes) VALUES
      ('Whey Protein Production Run A', 'PP-X33-BLG', 80.0, 78.5, 0.92, '{"temperature":30,"ph":5.5,"duration":72,"substrate":"glucose"}', 'validated', 'Model prediction within 2% of actual yield'),
      ('Casein Synthesis Batch 12', 'PP-MUT-CAS', 79.5, 82.3, 0.88, '{"temperature":28,"ph":6.0,"duration":96,"substrate":"glycerol"}', 'validated', 'Actual yield exceeded prediction due to optimized feed strategy'),
      ('Heme Protein Fermentation', 'EC-BL21-LEGH', 62.0, 65.0, 0.85, '{"temperature":25,"ph":6.5,"duration":120,"inducer":"methanol"}', 'validated', 'Slower induction rate improved folding and yield'),
      ('Lipase Enzyme Production', 'AN-NRRL3122', 89.0, 91.2, 0.94, '{"temperature":35,"ph":4.5,"duration":48,"substrate":"corn_starch"}', 'validated', 'Highly predictable process with well-characterized strain'),
      ('Vitamin B12 Synthesis', 'PD-MB580', 50.0, 45.8, 0.78, '{"temperature":30,"ph":7.0,"duration":168,"cobalt_supplement":true}', 'validated', 'Complex pathway leads to higher prediction variance'),
      ('Collagen Type I Production', 'AO-RIB40-COL', 45.0, null, 0.72, '{"temperature":28,"ph":5.8,"duration":144,"substrate":"glucose"}', 'pending', 'First prediction for new collagen strain, lower confidence'),
      ('Mycoprotein Biomass Growth', 'FV-QUORN-A3', 87.0, 88.7, 0.96, '{"temperature":28,"ph":6.2,"duration":36,"feed_rate":2.5}', 'validated', 'Highly reproducible continuous process'),
      ('Rennet Chymosin Production', 'AN-AW-CHY', 83.0, 85.1, 0.91, '{"temperature":33,"ph":5.0,"duration":60,"substrate":"maltodextrin"}', 'validated', 'Consistent with historical batch data'),
      ('Insulin Precursor Batch', 'SC-INS-7', 72.0, 70.2, 0.83, '{"temperature":30,"ph":5.5,"duration":72,"inducer":"galactose"}', 'validated', 'Slight under-performance due to plasmid instability'),
      ('Egg White Ovalbumin', 'KP-CBS7435-OVA', 63.0, 58.9, 0.80, '{"temperature":25,"ph":6.3,"duration":84,"substrate":"methanol"}', 'validated', 'Ovalbumin folding challenges reduce effective yield'),
      ('Pea Hemoglobin Synthesis', 'EC-BL21-LEGH', 58.0, 55.3, 0.82, '{"temperature":37,"ph":7.2,"duration":24,"iptg_conc":0.5}', 'validated', 'Inclusion body formation limits soluble yield'),
      ('Protease Enzyme Batch', 'BL-ATCC14580', 90.0, 92.0, 0.95, '{"temperature":37,"ph":8.5,"duration":48,"substrate":"soy_flour"}', 'validated', 'Mature process with excellent predictability'),
      ('Natamycin Production', 'SN-ATCC27448', 65.0, null, 0.75, '{"temperature":26,"ph":7.0,"duration":144,"substrate":"glucose_soy"}', 'pending', 'Secondary metabolite prediction has inherent variability'),
      ('Cellulase Complex Production', 'TR-RUT-C30', 78.0, 76.4, 0.89, '{"temperature":28,"ph":4.8,"duration":120,"inducer":"lactose"}', 'validated', 'Cellulose induction kinetics well-modeled'),
      ('Lactoferrin Expression', 'PP-GS115-hLF', 70.0, null, 0.77, '{"temperature":28,"ph":6.0,"duration":96,"substrate":"glycerol_methanol"}', 'pending', 'New process awaiting experimental validation')
    `);

    // Seed contamination records
    await client.query(`
      INSERT INTO contamination_records (process_name, contaminant_type, detection_method, severity, action_taken, resolved, detection_date, resolution_date, notes) VALUES
      ('Whey Protein Production Run A', 'Lactobacillus sp.', 'Microscopy + Gram stain', 'low', 'Increased sterile air flow, added 50ppm sodium hypochlorite to feed lines', true, '2025-12-15', '2025-12-16', 'Minor bacterial contamination in feed line, caught early'),
      ('Casein Synthesis Batch 12', 'Wild yeast (Candida)', 'Plate culture on differential agar', 'medium', 'Batch terminated, full CIP cycle with peracetic acid', true, '2025-11-20', '2025-11-22', 'Contamination traced to improperly sealed inoculum flask'),
      ('Heme Protein Fermentation', 'Bacteriophage T4-like', 'PCR detection + plaque assay', 'high', 'Immediate batch termination, chlorination of all water systems, 72h quarantine', true, '2025-10-05', '2025-10-09', 'Phage contamination in E. coli process, required full facility decontamination'),
      ('Mycoprotein Biomass Growth', 'Penicillium sp.', 'Visual inspection + microscopy', 'low', 'Adjusted air filtration, replaced HEPA filters', true, '2025-12-01', '2025-12-02', 'Airborne mold spore detected on sampling port seal'),
      ('Lipase Enzyme Production', 'Bacillus cereus', 'Colony morphology + biochemical tests', 'medium', 'Discarded batch, sanitized bioreactor with NaOH 2M', true, '2025-09-18', '2025-09-20', 'Spore-forming contaminant survived inadequate sterilization'),
      ('Vitamin B12 Synthesis', 'Acetobacter sp.', 'API 20E identification', 'low', 'Adjusted pH control to suppress contaminant, batch continued', true, '2025-11-10', '2025-11-11', 'Low-level contamination controlled through pH manipulation'),
      ('Insulin Precursor Batch', 'Endotoxin elevation', 'LAL (Limulus) assay', 'critical', 'Batch rejected for pharmaceutical use, diverted to research', true, '2025-08-25', '2025-08-30', 'Endotoxin levels exceeded 0.25 EU/mL limit, investigated lysis timing'),
      ('Egg White Ovalbumin', 'Mold (Aspergillus fumigatus)', 'Microscopy + lactophenol blue', 'medium', 'Batch terminated, air handling unit serviced', true, '2025-10-22', '2025-10-25', 'A. fumigatus detected, possible HVAC cross-contamination'),
      ('Protease Enzyme Batch', 'None detected', 'Routine sterility check', 'low', 'No action needed, false alarm from sampling artifact', true, '2025-12-05', '2025-12-05', 'Turbidity in sample was protein aggregate, not contamination'),
      ('Rennet Chymosin Production', 'Trichoderma sp.', 'Microscopy + ITS sequencing', 'medium', 'Halted batch, deep clean of bioreactor gaskets', true, '2025-07-14', '2025-07-17', 'Fungal cross-contamination from adjacent Trichoderma bioreactor'),
      ('Cellulase Complex Production', 'Bacterial biofilm', 'ATP bioluminescence assay', 'high', 'Full disassembly and CIP of bioreactor internals', true, '2025-09-30', '2025-10-04', 'Biofilm detected in cooling coils, may have been persisting for multiple batches'),
      ('Natamycin Production', 'Staphylococcus epidermidis', 'Selective agar plating', 'low', 'Operator retraining on aseptic technique, batch continued', true, '2025-11-28', '2025-11-28', 'Human skin flora detected, attributed to sampling technique error'),
      ('Pea Hemoglobin Synthesis', 'Lambda phage', 'PCR screening', 'medium', 'Switched to phage-resistant host strain', true, '2025-08-12', '2025-08-15', 'Lysogenic phage activation under stress conditions'),
      ('Collagen Type I Production', 'Suspected mycoplasma', 'qPCR mycoplasma detection kit', 'high', 'Process paused, all media stocks tested and replaced', false, '2026-01-08', null, 'Under investigation, source not yet identified'),
      ('Lactoferrin Expression', 'Wild-type Pichia revertant', 'Marker gene PCR negative', 'medium', 'Glycerol stock re-verified, new inoculum from master cell bank', true, '2025-12-18', '2025-12-20', 'Loss of expression cassette suspected, reverted to master cell bank')
    `);

    // Seed bioreactors
    await client.query(`
      INSERT INTO bioreactors (name, type, capacity_liters, material, status, current_process, installation_date, last_maintenance, location, notes) VALUES
      ('BR-001', 'Stirred tank', 50.0, 'Stainless steel 316L', 'in_use', 'Whey Protein Production Run A', '2022-03-15', '2025-11-20', 'Lab A - Bay 1', 'Primary production bioreactor, Rushton impeller'),
      ('BR-002', 'Stirred tank', 50.0, 'Stainless steel 316L', 'in_use', 'Heme Protein Fermentation', '2022-03-15', '2025-10-15', 'Lab A - Bay 2', 'Dual impeller configuration for high viscosity'),
      ('BR-003', 'Airlift', 200.0, 'Stainless steel 316L', 'in_use', 'Mycoprotein Biomass Growth', '2023-01-10', '2025-12-01', 'Production Hall - Zone 1', 'Large-scale airlift for shear-sensitive organisms'),
      ('BR-004', 'Stirred tank', 10.0, 'Borosilicate glass', 'available', null, '2021-06-20', '2025-11-05', 'Lab B - Bench 1', 'Benchtop bioreactor for process development'),
      ('BR-005', 'Stirred tank', 10.0, 'Borosilicate glass', 'in_use', 'Vitamin B12 Synthesis', '2021-06-20', '2025-09-30', 'Lab B - Bench 2', 'Benchtop unit with advanced DO control'),
      ('BR-006', 'Wave/Rocking', 25.0, 'Single-use bag', 'available', null, '2023-08-01', '2025-12-10', 'Lab C - Clean Room', 'Single-use wave bioreactor for mammalian-like culture'),
      ('BR-007', 'Stirred tank', 500.0, 'Stainless steel 316L', 'maintenance', null, '2020-11-01', '2026-01-05', 'Production Hall - Zone 2', 'Pilot-scale bioreactor, scheduled valve replacement'),
      ('BR-008', 'Bubble column', 100.0, 'Stainless steel 316L', 'in_use', 'Insulin Precursor Batch', '2022-09-12', '2025-11-18', 'Production Hall - Zone 1', 'Bubble column suitable for low-shear applications'),
      ('BR-009', 'Stirred tank', 5.0, 'Borosilicate glass', 'available', null, '2024-02-28', '2025-12-15', 'Lab B - Bench 3', 'New benchtop unit for screening experiments'),
      ('BR-010', 'Continuous stirred', 75.0, 'Stainless steel 316L', 'in_use', 'Cellulase Complex Production', '2023-05-15', '2025-10-20', 'Lab A - Bay 3', 'Continuous operation capable with cell retention'),
      ('BR-011', 'Packed bed', 30.0, 'Stainless steel 316L', 'available', null, '2024-01-10', '2025-11-25', 'Lab C - Bay 1', 'Immobilized cell bioreactor for continuous enzyme production'),
      ('BR-012', 'Stirred tank', 2000.0, 'Stainless steel 316L', 'maintenance', null, '2019-04-20', '2026-01-10', 'Production Hall - Zone 3', 'Commercial-scale bioreactor, annual inspection ongoing'),
      ('BR-013', 'Membrane', 15.0, 'Stainless steel + PVDF membrane', 'available', null, '2024-06-01', '2025-12-08', 'Lab C - Bay 2', 'Membrane bioreactor for high-density perfusion culture'),
      ('BR-014', 'Stirred tank', 50.0, 'Stainless steel 316L', 'in_use', 'Egg White Ovalbumin', '2022-07-22', '2025-10-30', 'Lab A - Bay 4', 'Standard production bioreactor with in-line analytics'),
      ('BR-015', 'Photobioreactor', 100.0, 'Borosilicate glass tubes', 'available', null, '2024-09-15', '2025-12-20', 'Lab D - Greenhouse', 'Tubular photobioreactor for phototrophic organisms')
    `);

    // Seed environment controls
    await client.query(`
      INSERT INTO environment_controls (bioreactor_id, parameter_name, set_value, actual_value, unit, tolerance, status, notes) VALUES
      (1, 'Temperature', 30.000, 30.120, 'C', 0.500, 'normal', 'PID-controlled heating jacket'),
      (1, 'pH', 5.500, 5.480, 'pH', 0.100, 'normal', 'Acid/base dosing via peristaltic pumps'),
      (1, 'Dissolved Oxygen', 30.000, 28.500, 'percent', 5.000, 'normal', 'Cascade control: agitation then airflow'),
      (1, 'Agitation', 250.000, 248.000, 'RPM', 10.000, 'normal', 'Rushton impeller, variable speed drive'),
      (2, 'Temperature', 25.000, 25.300, 'C', 0.500, 'normal', 'Jacketed cooling with glycol circuit'),
      (2, 'pH', 6.500, 6.450, 'pH', 0.100, 'normal', 'NH4OH for pH control and nitrogen source'),
      (2, 'Dissolved Oxygen', 20.000, 18.200, 'percent', 5.000, 'normal', 'Oxygen-enriched air supply available'),
      (3, 'Temperature', 28.000, 28.800, 'C', 1.000, 'normal', 'External heat exchanger on recirculation loop'),
      (3, 'pH', 6.200, 6.350, 'pH', 0.200, 'normal', 'NaOH addition for pH maintenance'),
      (3, 'Airflow Rate', 1.500, 1.480, 'VVM', 0.100, 'normal', 'Mass flow controller on sterile air supply'),
      (5, 'Temperature', 30.000, 31.200, 'C', 0.500, 'warning', 'Heating element may need calibration'),
      (5, 'pH', 7.000, 6.820, 'pH', 0.100, 'warning', 'pH drift detected, buffer capacity low'),
      (8, 'Temperature', 30.000, 30.050, 'C', 0.500, 'normal', 'Precise temperature control for insulin batch'),
      (8, 'Dissolved Oxygen', 40.000, 38.500, 'percent', 5.000, 'normal', 'High DO setpoint for aerobic growth phase'),
      (10, 'Temperature', 28.000, 27.900, 'C', 0.500, 'normal', 'Continuous process requires stable temperature'),
      (10, 'pH', 4.800, 4.750, 'pH', 0.100, 'normal', 'Acidic pH optimal for cellulase induction'),
      (10, 'Feed Rate', 2.500, 2.520, 'mL/min', 0.200, 'normal', 'Continuous glucose feed with gravimetric control'),
      (14, 'Temperature', 25.000, 25.100, 'C', 0.500, 'normal', 'Lower temperature for proper ovalbumin folding'),
      (14, 'pH', 6.300, 6.280, 'pH', 0.100, 'normal', 'Phosphate buffer system for pH stability'),
      (14, 'Foam Level', 15.000, 32.000, 'percent', 5.000, 'critical', 'Excessive foaming detected, antifoam addition required')
    `);

    // Seed quality records
    await client.query(`
      INSERT INTO quality_records (batch_id, product_name, test_type, test_result, specification_min, specification_max, unit, passed, tested_by, test_date, notes) VALUES
      ('WP-2025-001', 'Beta-lactoglobulin', 'Protein purity (SDS-PAGE)', 94.5000, 90.0000, 100.0000, 'percent', true, 'Dr. Elena Vasquez', '2025-12-20', 'Coomassie-stained gel densitometry analysis'),
      ('WP-2025-001', 'Beta-lactoglobulin', 'Endotoxin (LAL)', 0.1200, 0.0000, 0.2500, 'EU/mL', true, 'Sarah Chen', '2025-12-20', 'Kinetic turbidimetric LAL assay'),
      ('CS-2025-012', 'Alpha-s1-casein', 'Protein concentration', 8.2000, 5.0000, 15.0000, 'g/L', true, 'Dr. Raj Patel', '2025-11-25', 'Bradford assay with BSA standard curve'),
      ('CS-2025-012', 'Alpha-s1-casein', 'Microbial count (TPC)', 85.0000, 0.0000, 100.0000, 'CFU/mL', true, 'Marcus Williams', '2025-11-25', 'Total plate count on PCA agar, 48h at 30C'),
      ('HP-2025-003', 'Leghemoglobin', 'Heme content', 3.8000, 3.0000, 5.0000, 'mg/g protein', true, 'Dr. Elena Vasquez', '2025-12-22', 'Pyridine hemochrome assay for heme quantification'),
      ('HP-2025-003', 'Leghemoglobin', 'Color intensity (a* value)', 22.5000, 18.0000, 28.0000, 'CIELAB', true, 'Sarah Chen', '2025-12-22', 'Colorimetric analysis for meat-color application'),
      ('LE-2025-004', 'Lipase', 'Enzyme activity', 12500.0000, 10000.0000, 20000.0000, 'U/mL', true, 'Dr. Raj Patel', '2025-09-22', 'p-NPP substrate assay at pH 7.0, 37C'),
      ('LE-2025-004', 'Lipase', 'Thermostability (60C, 1h)', 88.0000, 80.0000, 100.0000, 'percent residual', true, 'Dr. Raj Patel', '2025-09-22', 'Residual activity after heat treatment'),
      ('B12-2025-005', 'Cyanocobalamin', 'B12 concentration', 45.2000, 30.0000, 80.0000, 'mg/L', true, 'Marcus Williams', '2025-11-15', 'HPLC-UV quantification at 361nm'),
      ('MP-2025-007', 'Mycoprotein', 'Protein content', 45.0000, 40.0000, 55.0000, 'percent dry weight', true, 'Sarah Chen', '2025-12-05', 'Kjeldahl nitrogen x 6.25 conversion factor'),
      ('MP-2025-007', 'Mycoprotein', 'RNA content', 0.8000, 0.0000, 1.0000, 'percent dry weight', true, 'Dr. Elena Vasquez', '2025-12-05', 'RNA reduction via heat treatment verified'),
      ('RC-2025-008', 'Chymosin', 'Milk clotting activity', 185.0000, 150.0000, 220.0000, 'IMCU/mL', true, 'Dr. Raj Patel', '2025-12-10', 'International milk clotting unit assay'),
      ('IP-2025-009', 'Insulin precursor', 'Identity (Mass spec)', 5808.0000, 5805.0000, 5810.0000, 'Da', true, 'Dr. Elena Vasquez', '2025-08-28', 'MALDI-TOF mass spectrometry identity confirmation'),
      ('OV-2025-012', 'Ovalbumin', 'Foaming capacity', 285.0000, 250.0000, 350.0000, 'percent volume increase', true, 'Sarah Chen', '2025-10-28', 'Functional test: whipping capacity at pH 7'),
      ('OV-2025-012', 'Ovalbumin', 'Gel strength', 420.0000, 350.0000, 500.0000, 'Pa', true, 'Marcus Williams', '2025-10-28', 'Rheometer measurement of heat-set gel at 80C'),
      ('PE-2025-015', 'Alkaline protease', 'Protease activity', 95000.0000, 80000.0000, 120000.0000, 'U/g', true, 'Dr. Raj Patel', '2025-12-08', 'Casein substrate Folin-Ciocalteu method')
    `);

    // Seed recipes
    await client.query(`
      INSERT INTO recipes (name, product_type, strain_name, media_name, fermentation_type, duration_hours, temperature, ph_level, agitation_rpm, aeration_rate, steps_json, status, notes) VALUES
      ('BLG-Fed-Batch-v3', 'Recombinant protein', 'PP-X33-BLG', 'BMGY Growth Medium', 'fed-batch', 72, 30.0, 5.5, 250, 1.5, '[{"step":1,"action":"Inoculate from seed culture at OD600=2.0","duration_h":0},{"step":2,"action":"Glycerol batch phase at 30C","duration_h":24},{"step":3,"action":"Glycerol fed-batch phase, 12mL/h/L","duration_h":6},{"step":4,"action":"Methanol adaptation, 3mL/h/L","duration_h":6},{"step":5,"action":"Methanol induction phase, ramp to 10mL/h/L","duration_h":36}]', 'approved', 'Optimized BLG production protocol, 3rd revision'),
      ('Casein-Continuous-v1', 'Recombinant protein', 'PP-MUT-CAS', 'Pichia Basal Salts', 'continuous', 96, 28.0, 6.0, 200, 1.2, '[{"step":1,"action":"Batch growth on glycerol to OD600=100","duration_h":24},{"step":2,"action":"Start continuous methanol feed at D=0.02/h","duration_h":12},{"step":3,"action":"Achieve steady state, maintain D=0.03/h","duration_h":60}]', 'approved', 'Continuous casein production for dairy alternatives'),
      ('LegHb-IPTG-v2', 'Recombinant protein', 'EC-BL21-LEGH', 'TB Terrific Broth', 'batch', 24, 37.0, 7.2, 300, 2.0, '[{"step":1,"action":"Inoculate at 1% v/v from overnight culture","duration_h":0},{"step":2,"action":"Grow at 37C to OD600=0.6","duration_h":3},{"step":3,"action":"Reduce temperature to 25C","duration_h":0.5},{"step":4,"action":"Induce with 0.5mM IPTG","duration_h":0},{"step":5,"action":"Expression at 25C for 20h","duration_h":20}]', 'approved', 'Low-temperature IPTG induction for soluble leghemoglobin'),
      ('Lipase-SSF-v4', 'Enzyme', 'AN-NRRL3122', 'Corn Steep Liquor Medium', 'batch', 48, 35.0, 4.5, 180, 1.0, '[{"step":1,"action":"Spore inoculation at 10^6 spores/mL","duration_h":0},{"step":2,"action":"Germination phase at 30C","duration_h":12},{"step":3,"action":"Production phase, raise to 35C","duration_h":36}]', 'approved', 'Optimized lipase production with corn steep liquor'),
      ('B12-Extended-v2', 'Vitamin', 'PD-MB580', 'Defined Mineral Medium', 'fed-batch', 168, 30.0, 7.0, 200, 1.0, '[{"step":1,"action":"Aerobic growth phase with glucose","duration_h":48},{"step":2,"action":"Transition to microaerobic conditions","duration_h":12},{"step":3,"action":"Anaerobic B12 biosynthesis phase","duration_h":72},{"step":4,"action":"Cobalt supplementation pulse","duration_h":0},{"step":5,"action":"Final accumulation phase","duration_h":36}]', 'approved', 'Two-phase aerobic/anaerobic B12 production protocol'),
      ('Mycoprotein-Cont-v5', 'Biomass', 'FV-QUORN-A3', 'Fed-Batch Glucose Feed', 'continuous', 36, 28.0, 6.2, 0, 1.5, '[{"step":1,"action":"Batch growth to fill airlift bioreactor","duration_h":12},{"step":2,"action":"Start continuous glucose feed at 2.5g/L/h","duration_h":0},{"step":3,"action":"Harvest continuously at D=0.17/h","duration_h":24}]', 'approved', 'Continuous mycoprotein production in airlift bioreactor'),
      ('Chymosin-Batch-v3', 'Enzyme', 'AN-AW-CHY', 'Czapek-Dox Modified', 'batch', 60, 33.0, 5.0, 200, 1.2, '[{"step":1,"action":"Inoculate from pre-culture at 5% v/v","duration_h":0},{"step":2,"action":"Growth phase on sucrose","duration_h":24},{"step":3,"action":"Maltodextrin feed for chymosin induction","duration_h":36}]', 'approved', 'Standard chymosin production batch protocol'),
      ('Insulin-GAL-v1', 'Pharmaceutical', 'SC-INS-7', 'YPD Rich Medium', 'batch', 72, 30.0, 5.5, 250, 1.5, '[{"step":1,"action":"Growth on glucose to OD600=10","duration_h":18},{"step":2,"action":"Wash cells, resuspend in galactose medium","duration_h":2},{"step":3,"action":"Galactose induction at 30C","duration_h":52}]', 'testing', 'GAL1 promoter induction for insulin precursor'),
      ('Ovalbumin-MeOH-v2', 'Recombinant protein', 'KP-CBS7435-OVA', 'BMMY Induction Medium', 'fed-batch', 84, 25.0, 6.3, 220, 1.3, '[{"step":1,"action":"Glycerol growth phase","duration_h":24},{"step":2,"action":"Glycerol fed-batch transition","duration_h":6},{"step":3,"action":"Methanol adaptation at low feed rate","duration_h":6},{"step":4,"action":"Full methanol induction at 25C","duration_h":48}]', 'approved', 'Low-temperature ovalbumin expression for proper folding'),
      ('Natamycin-Strep-v1', 'Secondary metabolite', 'SN-ATCC27448', 'Soybean Meal Medium', 'batch', 144, 26.0, 7.0, 180, 1.0, '[{"step":1,"action":"Spore germination in seed medium","duration_h":24},{"step":2,"action":"Vegetative growth phase","duration_h":48},{"step":3,"action":"Secondary metabolite production phase","duration_h":72}]', 'testing', 'Natamycin biosynthesis optimization in progress'),
      ('Cellulase-Cont-v4', 'Enzyme complex', 'TR-RUT-C30', 'Mandels-Andreotti Medium', 'continuous', 120, 28.0, 4.8, 200, 1.2, '[{"step":1,"action":"Batch growth on glucose","duration_h":24},{"step":2,"action":"Transition to lactose/cellulose inducer","duration_h":12},{"step":3,"action":"Continuous production with cell retention","duration_h":84}]', 'approved', 'Continuous cellulase production with membrane retention'),
      ('Collagen-III-v1', 'Recombinant protein', 'AO-RIB40-COL', 'Czapek-Dox Modified', 'fed-batch', 144, 28.0, 5.8, 180, 1.0, '[{"step":1,"action":"Spore inoculation and germination","duration_h":18},{"step":2,"action":"Biomass accumulation on glucose","duration_h":48},{"step":3,"action":"Starch feed for collagen expression","duration_h":78}]', 'draft', 'First draft protocol for recombinant collagen III'),
      ('Protease-HCD-v3', 'Enzyme', 'BL-ATCC14580', 'Soybean Meal Medium', 'fed-batch', 48, 37.0, 8.5, 300, 2.0, '[{"step":1,"action":"Inoculate at 2% v/v from overnight","duration_h":0},{"step":2,"action":"Exponential growth at 37C","duration_h":12},{"step":3,"action":"Soy flour fed-batch for protease induction","duration_h":36}]', 'approved', 'High cell density alkaline protease production'),
      ('Lactoferrin-Fed-v1', 'Recombinant protein', 'PP-GS115-hLF', 'Pichia Basal Salts', 'fed-batch', 96, 28.0, 6.0, 250, 1.5, '[{"step":1,"action":"Glycerol batch phase","duration_h":24},{"step":2,"action":"Glycerol fed-batch, ramp down","duration_h":8},{"step":3,"action":"Methanol induction, 25C","duration_h":64}]', 'draft', 'Lactoferrin production protocol under development'),
      ('Hemoglobin-HT-v1', 'Recombinant protein', 'EC-BL21-LEGH', 'LB + IPTG Induction', 'batch', 24, 37.0, 7.0, 350, 2.5, '[{"step":1,"action":"High-density growth in TB at 37C","duration_h":4},{"step":2,"action":"Cool to 20C, induce with 0.1mM IPTG","duration_h":0.5},{"step":3,"action":"Low-temp expression for 19h","duration_h":19}]', 'testing', 'Alternative low-IPTG protocol for improved solubility')
    `);

    // Seed batch schedules
    await client.query(`
      INSERT INTO batch_schedules (batch_name, recipe_name, bioreactor_name, start_date, end_date, priority, status, assigned_to, notes) VALUES
      ('WP-2026-001', 'BLG-Fed-Batch-v3', 'BR-001', '2026-01-15 08:00', '2026-01-18 08:00', 'high', 'in_progress', 'Sarah Chen', 'Q1 whey protein production batch'),
      ('CS-2026-002', 'Casein-Continuous-v1', 'BR-004', '2026-01-20 08:00', '2026-01-24 08:00', 'high', 'scheduled', 'Dr. Raj Patel', 'Casein for new dairy-free cheese partner'),
      ('HP-2026-003', 'LegHb-IPTG-v2', 'BR-002', '2026-01-10 06:00', '2026-01-11 06:00', 'urgent', 'in_progress', 'Marcus Williams', 'Urgent heme protein order for food tech client'),
      ('LE-2026-004', 'Lipase-SSF-v4', 'BR-009', '2026-02-01 08:00', '2026-02-03 08:00', 'medium', 'scheduled', 'Sarah Chen', 'Routine lipase production for Q1 inventory'),
      ('B12-2026-005', 'B12-Extended-v2', 'BR-005', '2026-01-05 08:00', '2026-01-12 08:00', 'medium', 'in_progress', 'Dr. Elena Vasquez', 'Week-long B12 fermentation run'),
      ('MP-2026-006', 'Mycoprotein-Cont-v5', 'BR-003', '2026-01-08 00:00', '2026-02-08 00:00', 'high', 'in_progress', 'Marcus Williams', 'Continuous mycoprotein production run'),
      ('RC-2026-007', 'Chymosin-Batch-v3', 'BR-014', '2026-02-05 08:00', '2026-02-07 20:00', 'medium', 'scheduled', 'Dr. Raj Patel', 'Monthly chymosin production batch'),
      ('IP-2026-008', 'Insulin-GAL-v1', 'BR-008', '2026-02-10 08:00', '2026-02-13 08:00', 'high', 'scheduled', 'Dr. Elena Vasquez', 'Insulin precursor trial batch'),
      ('OV-2026-009', 'Ovalbumin-MeOH-v2', 'BR-014', '2026-02-15 08:00', '2026-02-18 20:00', 'medium', 'scheduled', 'Sarah Chen', 'Ovalbumin production for bakery application tests'),
      ('CC-2026-010', 'Cellulase-Cont-v4', 'BR-010', '2026-01-02 08:00', '2026-01-07 08:00', 'high', 'completed', 'Marcus Williams', 'Completed cellulase continuous run'),
      ('NM-2026-011', 'Natamycin-Strep-v1', 'BR-004', '2026-02-20 08:00', '2026-02-26 08:00', 'low', 'scheduled', 'Dr. Raj Patel', 'Natamycin test batch for new strain evaluation'),
      ('CL-2026-012', 'Collagen-III-v1', 'BR-006', '2026-03-01 08:00', '2026-03-07 08:00', 'medium', 'scheduled', 'Dr. Elena Vasquez', 'First collagen production trial in wave bioreactor'),
      ('PE-2026-013', 'Protease-HCD-v3', 'BR-009', '2026-02-08 08:00', '2026-02-10 08:00', 'high', 'scheduled', 'Sarah Chen', 'Protease production for food processing client'),
      ('LF-2026-014', 'Lactoferrin-Fed-v1', 'BR-001', '2026-02-01 08:00', '2026-02-05 08:00', 'medium', 'scheduled', 'Dr. Raj Patel', 'Lactoferrin protocol development run'),
      ('WP-2026-015', 'BLG-Fed-Batch-v3', 'BR-001', '2026-03-10 08:00', '2026-03-13 08:00', 'high', 'scheduled', 'Sarah Chen', 'Q1 second whey protein batch for scale-up data')
    `);

    // Seed cost analyses
    await client.query(`
      INSERT INTO cost_analyses (batch_name, raw_material_cost, labor_cost, energy_cost, equipment_cost, overhead_cost, total_cost, revenue, profit_margin, currency, analysis_date, notes) VALUES
      ('WP-2025-001', 2450.00, 1800.00, 320.00, 450.00, 780.00, 5800.00, 12500.00, 53.60, 'USD', '2025-12-22', 'Whey protein batch profitable, media cost dominant'),
      ('CS-2025-012', 3100.00, 2200.00, 480.00, 450.00, 920.00, 7150.00, 15800.00, 54.75, 'USD', '2025-11-28', 'Casein premium pricing supports strong margin'),
      ('HP-2025-003', 1800.00, 1500.00, 280.00, 350.00, 620.00, 4550.00, 18200.00, 75.00, 'USD', '2025-12-24', 'Heme protein high-value application yields excellent margin'),
      ('LE-2025-004', 980.00, 900.00, 150.00, 200.00, 380.00, 2610.00, 5200.00, 49.81, 'USD', '2025-09-25', 'Lipase production cost-effective with CSL medium'),
      ('B12-2025-005', 1200.00, 2800.00, 520.00, 350.00, 780.00, 5650.00, 9800.00, 42.35, 'USD', '2025-11-18', 'Long fermentation increases labor and energy costs'),
      ('MP-2025-007', 5200.00, 1200.00, 890.00, 600.00, 1250.00, 9140.00, 22000.00, 58.45, 'USD', '2025-12-08', 'Continuous mycoprotein has high throughput, good margins'),
      ('RC-2025-008', 1500.00, 1100.00, 210.00, 300.00, 520.00, 3630.00, 8900.00, 59.21, 'USD', '2025-12-12', 'Chymosin batch standard profitability'),
      ('IP-2025-009', 2800.00, 3500.00, 380.00, 500.00, 1200.00, 8380.00, 35000.00, 76.06, 'USD', '2025-09-02', 'Pharmaceutical-grade insulin precursor commands premium'),
      ('OV-2025-012', 2100.00, 1600.00, 350.00, 400.00, 680.00, 5130.00, 9500.00, 46.00, 'USD', '2025-10-30', 'Ovalbumin moderate margin, yield improvement needed'),
      ('PH-2025-013', 650.00, 600.00, 95.00, 150.00, 280.00, 1775.00, 4800.00, 63.02, 'USD', '2025-08-18', 'Short E. coli batch very cost-effective'),
      ('PE-2025-015', 750.00, 800.00, 140.00, 200.00, 320.00, 2210.00, 6500.00, 66.00, 'USD', '2025-12-10', 'Industrial protease high volume, low cost per unit'),
      ('CC-2025-010', 1800.00, 2400.00, 450.00, 400.00, 850.00, 5900.00, 11200.00, 47.32, 'USD', '2025-10-25', 'Cellulase continuous run amortizes setup costs'),
      ('NM-2025-test', 1100.00, 1800.00, 380.00, 300.00, 580.00, 4160.00, 7200.00, 42.22, 'USD', '2025-12-01', 'Natamycin test batch, costs expected to decrease at scale'),
      ('WP-2025-002', 2380.00, 1750.00, 310.00, 450.00, 760.00, 5650.00, 12200.00, 53.69, 'USD', '2025-10-15', 'Second whey protein batch, slightly improved efficiency'),
      ('CS-2025-010', 3200.00, 2300.00, 490.00, 450.00, 940.00, 7380.00, 16200.00, 54.44, 'USD', '2025-09-30', 'Casein batch with new media formulation, costs slightly higher')
    `);

    // Seed compliance records
    await client.query(`
      INSERT INTO compliance_records (regulation_name, category, requirement, status, due_date, assigned_to, evidence, last_audit_date, notes) VALUES
      ('FDA GRAS Notification', 'Food Safety', 'Submit GRAS notification for novel protein ingredient with safety data package', 'compliant', '2026-06-15', 'Dr. Elena Vasquez', 'GRAS notice GRN-1042 accepted by FDA', '2026-01-10', 'Leghemoglobin GRAS status confirmed'),
      ('EU Novel Food Regulation EC 2015/2283', 'Novel Food', 'Complete novel food application including safety assessment and nutritional data', 'in_progress', '2026-09-01', 'Dr. Raj Patel', 'Application dossier 70% complete', '2025-11-20', 'Awaiting toxicology study results'),
      ('GMP Compliance 21 CFR Part 117', 'Manufacturing', 'Maintain current Good Manufacturing Practices for food-grade production', 'compliant', '2026-03-30', 'Sarah Chen', 'Annual GMP audit passed - zero critical findings', '2026-02-15', 'Next audit scheduled Q1 2027'),
      ('HACCP Plan Implementation', 'Food Safety', 'Implement and maintain HACCP plan covering all critical control points', 'compliant', '2026-04-01', 'Marcus Williams', 'HACCP plan v4.2 verified, 7 CCPs monitored', '2026-01-25', 'CCP monitoring logs up to date'),
      ('Allergen Management Protocol', 'Allergen Safety', 'Establish allergen control program for fermentation-derived proteins', 'pending_review', '2026-05-15', 'Sarah Chen', 'Draft allergen management plan submitted', '2025-12-10', 'Soy-derived media requires allergen labeling assessment'),
      ('ISO 22000:2018 Certification', 'Quality Management', 'Achieve and maintain ISO 22000 food safety management system certification', 'in_progress', '2026-08-01', 'James Thornton', 'Stage 1 audit completed, Stage 2 scheduled', '2026-01-30', 'Documentation gaps identified in traceability'),
      ('Kosher Certification', 'Religious Compliance', 'Obtain kosher certification for fermentation-derived food ingredients', 'compliant', '2026-12-31', 'Dr. Elena Vasquez', 'OU Kosher certification renewed', '2025-10-05', 'All media components verified kosher'),
      ('Halal Certification', 'Religious Compliance', 'Obtain halal certification for precision fermentation products', 'pending_review', '2026-07-01', 'Dr. Raj Patel', 'IFANCA application submitted', '2025-11-15', 'Ethanol-free processing verified'),
      ('Non-GMO Project Verification', 'Labeling', 'Verify non-GMO status for products using non-engineered organisms', 'non_compliant', '2026-04-30', 'Marcus Williams', 'Some strains use genetic modification - cannot certify', NULL, 'Only wild-type strains eligible for non-GMO label'),
      ('FDA Facility Registration', 'Regulatory', 'Maintain FDA food facility registration and biennial renewal', 'compliant', '2026-10-01', 'James Thornton', 'Registration #18274652 current', '2025-12-01', 'Biennial renewal due Oct 2026'),
      ('Wastewater Discharge Permit', 'Environmental', 'Comply with local wastewater discharge limits for fermentation effluent', 'compliant', '2026-06-30', 'Sarah Chen', 'Monthly discharge reports submitted, all within limits', '2026-02-28', 'BOD levels consistently below permit limits'),
      ('Occupational Safety OSHA', 'Worker Safety', 'Maintain OSHA compliance for bioreactor operations and chemical handling', 'compliant', '2026-03-15', 'Marcus Williams', 'Annual safety audit passed, training records current', '2026-01-05', 'Zero lost-time incidents in 2025'),
      ('Product Labeling 21 CFR 101', 'Labeling', 'Ensure all product labels meet FDA nutrition labeling requirements', 'in_progress', '2026-05-01', 'Dr. Elena Vasquez', 'Label review in progress for 3 new products', '2025-10-20', 'Protein content claims require analytical verification'),
      ('Biocontainment BSL-1 Compliance', 'Biosafety', 'Maintain BSL-1 containment standards for production organisms', 'compliant', '2026-07-15', 'Dr. Raj Patel', 'IBC approval current, annual inspection passed', '2026-02-10', 'All organisms classified as BSL-1 / GRAS'),
      ('Supply Chain Traceability', 'Quality Management', 'Implement one-up one-down traceability for all raw materials and products', 'pending_review', '2026-06-01', 'James Thornton', 'ERP traceability module 80% configured', '2025-12-15', 'Pending validation of batch genealogy tracking')
    `);

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    console.log('Default user: demo@fermentation.ai / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
