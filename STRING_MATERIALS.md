# String Material Properties Documentation

## Wall Harp Simulator - String Physics Reference

This document describes the physical properties of different string materials used in the Wall Harp Simulator and how they affect pitch, tone, and playability.

---

## String Materials

### 1. Steel (Default)
**Density:** 7850 kg/m³
**Tension Range:** 80-150 N
**Default Tension:** 120 N
**Characteristics:**
- Bright, sustained tone
- High tension allows for precise tuning
- Excellent clarity and projection
- Longer sustain than other materials
- Common in modern harps and guitars

**Best For:** Clear articulation, bright sound, contemporary music

---

### 2. Nylon
**Density:** 1140 kg/m³
**Tension Range:** 40-80 N
**Default Tension:** 60 N
**Characteristics:**
- Warm, mellow tone
- Lower tension, easier on fingers
- Softer attack, gentler sound
- Classical guitar-like quality
- More flexible, less bright

**Best For:** Classical music, warm tones, gentle playing

---

### 3. Gut (Natural)
**Density:** 1300 kg/m³
**Tension Range:** 50-90 N
**Default Tension:** 70 N
**Characteristics:**
- Rich, organic tone
- Historical authenticity
- Complex harmonic content
- Medium tension
- Traditional harp sound

**Best For:** Historical music, baroque, traditional harp repertoire

---

### 4. Bronze (80/20)
**Density:** 8800 kg/m³
**Tension Range:** 70-130 N
**Default Tension:** 100 N
**Characteristics:**
- Bright, crisp tone
- Good sustain
- Balanced frequency response
- 80% copper, 20% zinc alloy
- Popular for acoustic guitars

**Best For:** Folk music, balanced tone, good projection

---

### 5. Phosphor Bronze
**Density:** 8900 kg/m³
**Tension Range:** 75-135 N
**Default Tension:** 105 N
**Characteristics:**
- Warm, balanced tone
- Excellent sustain
- Rich bass response
- 92% copper, 8% tin with phosphorus
- Corrosion resistant

**Best For:** Rich tones, long sustain, professional performance

---

## String Gauges (Diameter)

### Extra Light (0.25mm)
- **Higher pitch** for same length/tension
- Easier to play, less finger fatigue
- Brighter tone, less volume
- Best for: High register, delicate playing

### Light (0.35mm)
- Standard light gauge
- Good balance of playability and tone
- Versatile for most applications
- Best for: General use, beginners

### Medium (0.50mm)
- **Default gauge**
- Balanced tone and tension
- Full, rich sound
- Best for: Professional use, balanced sound

### Heavy (0.70mm)
- Fuller tone, higher tension
- More volume and projection
- Requires more finger strength
- Best for: Bass strings, maximum volume

### Extra Heavy (0.90mm)
- Maximum volume and sustain
- Very high tension
- Deep, powerful tone
- Best for: Lowest strings, maximum impact

---

## Physics Formula

### Wave Speed Calculation
The frequency of a vibrating string is determined by:

```
f = v / (2L)
```

Where:
- `f` = frequency (Hz)
- `v` = wave speed (m/s)
- `L` = vibrating length (m)

### Wave Speed from Material Properties
```
v = √(T / μ)
```

Where:
- `T` = string tension (N)
- `μ` = linear mass density (kg/m)

### Linear Mass Density
```
μ = π × r² × ρ
```

Where:
- `r` = string radius (m)
- `ρ` = material density (kg/m³)

---

## Practical Examples

### Example 1: Steel vs Nylon (Same Length, Same Tension)
- **Steel** (ρ=7850): Higher wave speed → **Higher pitch**
- **Nylon** (ρ=1140): Lower wave speed → **Lower pitch**

### Example 2: Light vs Heavy Gauge (Same Material, Same Tension)
- **Light (0.25mm)**: Lower mass → Higher wave speed → **Higher pitch**
- **Heavy (0.70mm)**: Higher mass → Lower wave speed → **Lower pitch**

### Example 3: Increasing Tension
- Same material, same gauge
- **Higher tension** → Higher wave speed → **Higher pitch**
- **Lower tension** → Lower wave speed → **Lower pitch**

---

## Recommendations by Music Style

### Classical/Baroque
- **Material:** Gut or Nylon
- **Gauge:** Medium
- **Reason:** Warm, authentic period sound

### Contemporary/Pop
- **Material:** Steel or Phosphor Bronze
- **Gauge:** Light to Medium
- **Reason:** Bright, modern sound with good sustain

### Folk/Traditional
- **Material:** Bronze or Phosphor Bronze
- **Gauge:** Medium to Heavy
- **Reason:** Balanced tone, good projection

### Experimental/Ambient
- **Material:** Any
- **Gauge:** Varies
- **Reason:** Explore different timbres and textures

---

## Technical Notes

1. **Tension Limits:** Exceeding the recommended tension range may cause string breakage or damage to the instrument

2. **Temperature Effects:** String pitch increases with temperature (strings expand, tension increases)

3. **Humidity Effects:** Natural materials (gut, nylon) are more affected by humidity than metals

4. **Break-In Period:** New strings require settling time (1-2 days) for stable tuning

5. **Harmonic Content:** Steel has more high harmonics, gut/nylon have more fundamental

---

## References

- *Physics of Music and Musical Instruments* by David Lapp
- *The Science of String Instruments* edited by Thomas D. Rossing
- *Harp Therapy Journal* - String Selection Guide
- Material density data from engineering handbooks

---

**Version:** 1.0
**Last Updated:** January 2025
**Wall Harp Simulator** - String Tuning System
