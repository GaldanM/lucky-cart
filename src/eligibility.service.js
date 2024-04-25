class EligibilityService {
  /**
   * Compare cart data with criteria to compute eligibility.
   * If all criteria are fulfilled then the cart is eligible (return true).
   *
   * @param cart
   * @param criteria
   * @return {boolean}
   */
  isEligible(cart, criteria) {
    if (Object.keys(criteria).length === 0){
      return false
    }

    if (Object.keys(cart).length === 0) {
      return false
    }


    for (const [criteriaKey, criteriaValue] of Object.entries(criteria)) {
      if (!cart[criteriaKey]) {
        return false
      }

      if (criteriaValue.gt) {
        return cart[criteriaKey] > criteriaValue.gt;
      }
      if (criteriaValue.lt) {
        return cart[criteriaKey] < criteriaValue.lt;
      }

      const criteriaValueString = criteriaValue.toString()
      const cartValueString = cart[criteriaKey].toString()

      if (criteriaValueString !== cartValueString) {
        return false
      }
    }

    return true
  }
}

module.exports = {
  EligibilityService,
};
