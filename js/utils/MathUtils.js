/**
 * Math utility functions for tuning calculations
 */
export class MathUtils {
    /**
     * Calculate the least common multiple of two numbers
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} - Least common multiple
     */
    static lcm(a, b) {
        return (a * b) / MathUtils.gcd(a, b);
    }

    /**
     * Calculate the least common multiple of an array of numbers
     * @param {number[]} arr - Array of numbers
     * @returns {number} - Least common multiple
     */
    static lcmArray(arr) {
        return arr.reduce((a, b) => MathUtils.lcm(a, b));
    }

    /**
     * Calculate the greatest common divisor of two numbers
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} - Greatest common divisor
     */
    static gcd(a, b) {
        return b === 0 ? a : MathUtils.gcd(b, a % b);
    }

    /**
     * Calculate the greatest common divisor of an array of numbers
     * @param {number[]} arr - Array of numbers
     * @returns {number} - Greatest common divisor
     */
    static gcdArray(arr) {
        return arr.reduce((a, b) => MathUtils.gcd(a, b));
    }

    /**
     * Sum two position arrays element-wise
     * @param {number[]} a - First position array
     * @param {number[]} b - Second position array
     * @returns {number[]} - Sum of positions
     */
    static positionSum(a, b) {
        let position = [];
        for (let i = 0; i < a.length; i++) {
            position[i] = a[i] + b[i];
        }
        return position;
    }

    /**
     * Compare two positions based on their frequency ratios
     * @param {number[]} a - First position
     * @param {number[]} b - Second position
     * @param {number[]} dimensionRatio - Dimension ratios
     * @returns {number} - Comparison result
     */
    static comparePositions(a, b, dimensionRatio) {
        const ratioA = MathUtils.calcRatio(a, dimensionRatio);
        const ratioB = MathUtils.calcRatio(b, dimensionRatio);
        return ratioA - ratioB;
    }

    /**
     * Calculate frequency ratio from position
     * @param {number[]} pos - Position array
     * @param {number[]} dimensionRatio - Dimension ratios
     * @returns {number} - Frequency ratio
     */
    static calcRatio(pos, dimensionRatio) {
        let ratio = 1;
        for (let i = 0; i < dimensionRatio.length; i++) {
            ratio *= Math.pow(dimensionRatio[i], pos[i]);
        }
        return ratio;
    }

    /**
     * Calculate distance from position
     * @param {number[]} pos - Position array
     * @param {number[]} dimensionRatio - Dimension ratios
     * @returns {number} - Distance
     */
    static calcDistance(pos, dimensionRatio) {
        let distance = 0;
        for (let i = 0; i < dimensionRatio.length; i++) {
            distance += Math.pow(dimensionRatio[i] * pos[i], 2);
        }
        return distance;
    }
}
