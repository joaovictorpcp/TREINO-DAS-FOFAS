export const generateEndurancePlan = (payload) => {
    const { studentProfile, trainingGoal } = payload;
    const { modality, benchmark, goalType, schedule } = trainingGoal;

    const generatedWorkouts = [];
    const today = new Date();

    // 1. Calculate Zones (Simplified)
    // Max HR Estimate
    const age = studentProfile.age || 30;
    const maxHR = 220 - age;

    // 2. Schedule Logic
    // Determine number of weeks
    let weeks = 4;
    if (schedule.targetDate) {
        const target = new Date(schedule.targetDate);
        const diffTime = Math.abs(target - today);
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        weeks = Math.max(4, Math.min(diffWeeks, 16)); // Cap between 4 and 16
    }

    const daysMap = { 'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6 };
    const selectedDays = schedule.days.map(d => daysMap[d]).sort();

    // 3. Generate Workouts
    for (let w = 0; w < weeks; w++) {
        // Periodization Phase
        let phase = 'Base';
        if (w > weeks * 0.4 && w <= weeks * 0.75) phase = 'Build';
        if (w > weeks * 0.75) phase = 'Taper';
        if (w === weeks - 1 && schedule.targetDate) phase = 'Race Week';

        // Weekly Volume Progression (Linear + Deload every 4th week)
        const isDeload = (w + 1) % 4 === 0;
        const volumeFactor = isDeload ? 0.6 : 1 + (w * 0.05);

        selectedDays.forEach((dayIndex, index) => {
            // Find date for this specific day in the current week
            const workoutDate = new Date(today);
            workoutDate.setDate(today.getDate() + (w * 7) + (dayIndex - today.getDay() + 7) % 7);

            // Skip past dates if any
            if (workoutDate < today) return;

            // Workout Type Strategy
            let type = 'Endurance';
            let title = 'Rodagem Z2';
            let rpe = 3;
            let duration = 45;
            let description = '';
            let drills = '';
            let distance = 0;

            // Simple distribution logic based on available days
            // If 1 day: Long Run
            // If 2 days: Interval + Long Run
            // If 3+ days: Interval + Tempo + Long Run + Easy

            if (selectedDays.length === 1) {
                type = 'Long';
                title = 'Longo Progressivo';
            } else if (selectedDays.length === 2) {
                if (index === 0) { type = 'Interval'; title = 'Tiros VO2Max'; }
                else { type = 'Long'; title = 'Longo'; }
            } else {
                if (index === 0) { type = 'Easy'; title = 'Regenerativo'; }
                else if (index === 1) { type = 'Interval'; title = 'Intervalado'; }
                else if (index === selectedDays.length - 1) { type = 'Long'; title = 'Longo'; }
                else { type = 'Tempo'; title = 'Tempo Run'; }
            }

            // Apply Phase modifiers
            if (phase === 'Taper') {
                duration *= 0.7;
                rpe -= 1;
                title += ' (Polimento)';
            }

            // Construct Workout Details based on Modality & Type
            if (modality === 'running') {
                drills = "Skipping Alto (2x30s) + Butt Kicks (2x30s)";
                if (type === 'Interval') {
                    duration = 50;
                    distance = 8;
                    rpe = 8;
                    description = "15' Aquecimento (Z1-Z2)\n\nSérie Principal:\n5x 1km @ Pace de 5k (Z4)\nRecuperação: 2' caminhando\n\n10' Soltura";
                    drills = "Acelerações 4x50m progressivo a cada volta.";
                } else if (type === 'Long') {
                    duration = 60 * volumeFactor; // e.g. 60 -> 66 -> 72
                    distance = 10 * volumeFactor;
                    rpe = 4;
                    description = `Aquecimento leve 10'.\n\nManter ritmo constante Z2 (${maxHR * 0.65}-${maxHR * 0.75} bpm).\nFocar na hidratação a cada 20'.`;
                } else {
                    duration = 40;
                    distance = 5;
                    rpe = 3;
                    description = "Rodagem leve Z2. Foco na técnica de corrida e cadência.";
                }
            } else if (modality === 'cycling') {
                drills = "Pedalada Unilateral (30s cada perna) x 3";
                if (type === 'Interval') {
                    duration = 60;
                    distance = 25;
                    rpe = 8;
                    description = "15' Aquecimento Giros leves\n\nSérie Principal: 6x 3' Força (Cadência 60-70rpm) @ Z4\nRec: 2' leve\n\n15' Soltura";
                } else if (type === 'Long') {
                    duration = 90 * volumeFactor;
                    distance = 40 * volumeFactor;
                    rpe = 4;
                    description = "Longo em Z2. Manter cadência alta (90rpm+).";
                } else {
                    duration = 45;
                    distance = 20;
                    rpe = 3;
                    description = "Giro Regina Z1/Z2. Soltar as pernas.";
                }
            } else if (modality === 'swimming') {
                drills = "Pernada Lateral (4x25m) + Costas Duplo (4x25m)";
                // Meters logic
                if (type === 'Interval') {
                    duration = 45;
                    distance = 1500 * volumeFactor;
                    rpe = 8;
                    description = "200m Aquece\n\n8x 50m Forte (Saída a cada 1:30)\n4x 100m Palmar moderado\n\n200m Soltura";
                } else if (type === 'Long') {
                    duration = 60;
                    distance = 2000 * volumeFactor;
                    rpe = 5;
                    description = "400m Aquece Variado\n\n3x 400m A2 (Ritmo de Cruzeiro) Int: 30s\n\n200m Soltura";
                } else {
                    duration = 30;
                    distance = 1000;
                    rpe = 3;
                    description = "Nado contínuo focado em técnica (cotovelo alto).";
                }
            }

            // Sanitization
            duration = Math.round(duration);
            distance = parseFloat(distance.toFixed(1));

            generatedWorkouts.push({
                id: crypto.randomUUID(), // Local generate ID
                date: workoutDate.toISOString().split('T')[0],
                activity_type: modality,
                title: title,
                description: description,
                drills_description: drills,
                distance_km: distance, // This might be meters for swim, user logic handles display
                duration_minutes: duration,
                session_rpe: rpe,
                normalized_load: Math.round(duration * rpe), // simplified
                status: 'planned'
            });
        });
    }

    return generatedWorkouts;
};
