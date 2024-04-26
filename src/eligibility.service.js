class EligibilityService {
	nestedObjectRegexp = new RegExp(/(\w+\.)+\w+/)

	constructor() {
		this.and = this.and.bind(this)
		this.or = this.or.bind(this)
		this.getNestedValues = this.getNestedValues.bind(this)
		this.operatorMap = {
			gt: this.gt,
			gte: this.gte,
			lt: this.lt,
			lte: this.lte,
			in: this.in,
			and: this.and,
			or: this.or,
		}
	}

	/**
	 * Compare cart data with criteria to compute eligibility.
	 * If all criteria are fulfilled then the cart is eligible (return true).
	 *
	 * @param cart
	 * @param criteria
	 * @return {boolean}
	 */
	isEligible(cart, criteria) {
		if (Object.keys(criteria).length === 0) {
			return true
		}

		if (Object.keys(cart).length === 0) {
			return false
		}

		for (const [criteriaKey, criteriaValue] of Object.entries(criteria)) {
			const isCriteriaKeyNested = this.nestedObjectRegexp.test(criteriaKey)

			let isConditionFulfilled
			if (isCriteriaKeyNested) {
				const newCriteriaKey = criteriaKey.replaceAll(".", "_")
				const newCartValues = this.getNestedValues(criteriaKey.split("."), cart)

				if (newCartValues.length === 0) {
					return false
				}

				isConditionFulfilled = this.checkCondition(newCriteriaKey, criteriaValue, newCartValues)
			} else {
				isConditionFulfilled = this.checkCondition(criteriaKey, criteriaValue, cart[criteriaKey])
			}

			if (!isConditionFulfilled) {
				return false
			}
		}

		return true
	}

	checkCondition(criteriaKey, criteriaValue, cartValue) {
		if (cartValue === null) {
			return false
		}

		const isCartValueAnArray = Array.isArray(cartValue)
		if (isCartValueAnArray) {
			return cartValue.some(cartValueItem => this.checkCondition(criteriaKey, criteriaValue, cartValueItem))
		}

		const isCriteriaKeyAnOperator = Boolean(this.operatorMap[criteriaKey])
		if (isCriteriaKeyAnOperator) {
			return this.operatorMap[criteriaKey](cartValue, criteriaValue)
		}

		const isCriteriaValueAnObject = typeof criteriaValue === 'object'
		if (isCriteriaValueAnObject) {
			const [[subCriteriaKey, subCriteriaValue]] = Object.entries(criteriaValue)
			return this.checkCondition(subCriteriaKey, subCriteriaValue, cartValue)
		}

		return criteriaValue.toString() === cartValue.toString();
	}

	gt(cartValue, criteriaValue) {
		return cartValue > criteriaValue;
	}

	gte(cartValue, criteriaValue) {
		return cartValue >= criteriaValue;
	}

	lt(cartValue, criteriaValue) {
		return cartValue < criteriaValue;
	}

	lte(cartValue, criteriaValue) {
		return cartValue <= criteriaValue;
	}

	in(cartValue, criteriaValue) {
		return criteriaValue.includes(cartValue);
	}

	and(cartValue, criteriaValue) {
		return Object.entries(criteriaValue).reduce((previousCondition, [subCriteriaKey, subCriteriaValue]) => {
			const isSubConditionFulfilled = this.checkCondition(subCriteriaKey, subCriteriaValue, cartValue)
			return previousCondition && isSubConditionFulfilled
		}, true)
	}

	or(cartValue, criteriaValue) {
		return Object.entries(criteriaValue).reduce((previousCondition, [subCriteriaKey, subCriteriaValue]) => {
			const isSubConditionFulfilled = this.checkCondition(subCriteriaKey, subCriteriaValue, cartValue)
			return previousCondition || isSubConditionFulfilled
		}, false)
	}

	getNestedValues(object, keys) {
		const [firstKey] = keys

		const value = object[firstKey]
		if (value === undefined) {
			return []
		}

		if (Array.isArray(value)) {
			return value.reduce((acc, subObj) => [...acc, ...this.getNestedValues(subObj, keys.slice(1))], [])
		}

		if (typeof value === 'object') {
			return this.getNestedValues(value, keys.slice(1))
		}

		const isLastPath = keys.length === 1
		if (!isLastPath) {
			return []
		}

		return [value]
	}
}

module.exports = {
	EligibilityService,
};
