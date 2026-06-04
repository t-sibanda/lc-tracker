import type { TestStep } from '@/types';

let nextStepId = 1;
function stepId(): string { return `step-${Date.now()}-${nextStepId++}`; }

function makeStep(action: string, expectedResult: string): TestStep {
  return { id: stepId(), action, expectedResult, verified: false, actualReading: '', notes: '' };
}

// ─── Control Panel Verification ──────────────────────────────────
// These steps apply to ALL I/O points (shared physical panel checks)
export function generatePanelVerificationSteps(): TestStep[] {
  return [
    makeStep('Review the panel shop test records.', 'The panel shop has completed a wire pull test on all the panel wiring.'),
    makeStep('Review the panel shop test records.', 'The panel shop has completed a continuity test on all the panel wiring.'),
    makeStep('Ensure that live power is NOT connected to the panel.', 'Live power is NOT connected to the panel.'),
    makeStep('Shut off/disconnect all circuit breakers and fuses in the panel.', 'All circuit breakers and fuses are shut off/disconnected per the power distribution diagrams.'),
    makeStep('Verify all labels are correct, adhered and located properly.', 'All labels are correct, adhered and located properly on the enclosure and panel.'),
    makeStep('Verify manufacturer, model number, material, quantity, and size.', 'Manufacturer, model number, material, quantity, and size match the Bill of Materials.'),
    makeStep('Inspect devices for physical defects.', 'The devices are free from obvious physical defects.'),
    makeStep('Verify device positions and spacing.', 'The devices are located in the correct positions with correct spacing.'),
    makeStep('Verify wireway sizing.', 'The wireways are the correct size.'),
    makeStep('Check for finger-safe components.', 'The panel is designed with finger safe components — no exposed energized parts >50V.'),
    makeStep('Inspect wiring for physical defects.', 'The wires are free from obvious physical defects.'),
    makeStep('For mechanical jumpers, torque-test the screws.', 'The screws have been properly tightened.'),
    makeStep('Pull-test the wires and jumpers.', 'The wires and jumpers do not come off the terminals.'),
    makeStep('Verify circuit breaker sizes match.', 'The circuit breaker sizes match the drawings.'),
    makeStep('Verify fuse sizes match.', 'The fuse sizes match the drawings.'),
    makeStep('Verify dip switch settings match.', 'Dip switch settings match the specifications.'),
    makeStep('Continuity test: check wire color, size and tag. DO NOT USE THE BEEP METHOD.', 'Wire color and size match the diagrams. Wire tags match. Resistance measured in Ohms.'),
    makeStep('Following power distribution drawings, continuity test all conductors.', 'All conductors are continuity tested using a multi-meter.'),
    makeStep('Following I/O wiring drawings, continuity test all conductors.', 'All I/O conductors are continuity tested using a multi-meter.'),
    makeStep('Verify panel mounted equipment, back panels and doors are grounded.', 'All panel mounted equipment, back panels and enclosure doors are properly grounded.'),
    makeStep('Turn on circuit breakers and fuses per power distribution diagrams.', 'All circuit breakers and fuses are turned on/connected.'),
    makeStep('Verify ground and neutral are NOT shorted to hot circuits.', 'Ground and neutral are not shorted to the hot circuits.'),
    makeStep('Verify DC positive and negative are NOT shorted.', 'DC positive and negative are not shorted.'),
    makeStep('Verify network cables are connected correctly and tags match.', 'Cables are connected correctly and tags match the drawing.'),
  ];
}

// ─── Analog Inputs Test Procedure ──────────────────────────────────
export function generateAnalogInputSteps(): TestStep[] {
  return [
    makeStep('With a signal generator, simulate a 4 mA signal at the field device terminal points/IS barrier.', 'The minimum raw value resides in the proper register in the PLC.'),
    makeStep('Record the PLC register value at 4 mA (0% signal).', 'Raw value matches expected minimum for the configured range.'),
    makeStep('With a signal generator, simulate a 12 mA signal at the field device terminal points/IS barrier.', 'The 50% raw value resides in the proper register in the PLC.'),
    makeStep('Record the PLC register value at 12 mA (50% signal).', 'Raw value is approximately mid-scale for the configured range.'),
    makeStep('With a signal generator, simulate a 20 mA (100%) signal at the field device terminal points/IS barrier.', 'The maximum raw value resides in the proper register in the PLC.'),
    makeStep('Record the PLC register value at 20 mA (100% signal).', 'Raw value matches expected maximum for the configured range.'),
    makeStep('Verify the scaled engineering value in the HMI/SCADA at 4 mA.', 'HMI displays the engineering minimum value correctly.'),
    makeStep('Verify the scaled engineering value in the HMI/SCADA at 12 mA.', 'HMI displays the engineering mid-scale value correctly.'),
    makeStep('Verify the scaled engineering value in the HMI/SCADA at 20 mA.', 'HMI displays the engineering maximum value correctly.'),
    makeStep('Verify alarm limits (if configured) at low and high thresholds.', 'Alarms activate at the configured low and high setpoints.'),
  ];
}

// ─── Discrete Inputs Test Procedure ──────────────────────────────────
export function generateDiscreteInputSteps(): TestStep[] {
  return [
    makeStep('Using a jumper or external power source (120 VAC or 24 VDC as specified), simulate the discrete device signal ON at the field wiring terminal points.', 'The proper discrete input module channel indicates the input is ON.'),
    makeStep('Verify the discrete input bit in the PLC is set.', 'The proper discrete input bit is SET in the PLC.'),
    makeStep('Using a jumper or external power source, simulate the discrete device signal OFF.', 'The proper discrete input module channel indicates the input is OFF.'),
    makeStep('Verify the discrete input bit in the PLC is reset.', 'The proper discrete input bit is RESET in the PLC.'),
    makeStep('If using the actual physical device (e.g. panel mounted pushbutton), press/activate the device.', 'The PLC receives the ON signal and the corresponding bit is set.'),
    makeStep('Release/deactivate the physical device.', 'The PLC receives the OFF signal and the corresponding bit is reset.'),
    makeStep('Verify the input LED indicator on the I/O module.', 'Module LED illuminates ON when input is active and OFF when inactive.'),
    makeStep('Verify the field device voltage matches the specification.', 'Voltage at field terminals matches 120 VAC or 24 VDC as specified.'),
  ];
}

// ─── Discrete Outputs Test Procedure ──────────────────────────────────
export function generateDiscreteOutputSteps(): TestStep[] {
  return [
    makeStep('At the PLC, set the discrete output bit ON.', 'The proper discrete output module channel indicates the output is ON.'),
    makeStep('For field equipment, using a meter at the terminal points, verify the output is ON.', 'For dry relay contacts: continuity confirmed. For 24 VDC: voltage confirmed. For 120 VAC: voltage confirmed.'),
    makeStep('For panel mounted equipment, verify the device is energized.', 'The panel mounted device is energized (audible/visible indication).'),
    makeStep('At the PLC, set the discrete output bit OFF.', 'The proper discrete output module channel indicates the output is OFF.'),
    makeStep('For field equipment, using a meter at the terminal points, verify the output is OFF.', 'For dry relay contacts: continuity open. For 24 VDC: no voltage. For 120 VAC: no voltage.'),
    makeStep('For panel mounted equipment, verify the device is de-energized.', 'The panel mounted device is de-energized (no audible/visible indication).'),
    makeStep('Verify the output LED indicator on the I/O module.', 'Module LED illuminates ON when output is active and OFF when inactive.'),
    makeStep('Verify proper fusing/protection for the output circuit.', 'Fuse sizes and protection devices match the specifications.'),
  ];
}

// ─── Master function: get all test steps for an I/O point ──────────
export function generateTestSteps(ioType: 'AI' | 'AO' | 'DI' | 'DO'): TestStep[] {
  const panelSteps = generatePanelVerificationSteps();
  let typeSteps: TestStep[] = [];

  switch (ioType) {
    case 'AI':
    case 'AO':
      typeSteps = generateAnalogInputSteps();
      break;
    case 'DI':
      typeSteps = generateDiscreteInputSteps();
      break;
    case 'DO':
      typeSteps = generateDiscreteOutputSteps();
      break;
  }

  return [...panelSteps, ...typeSteps];
}
