import moment from 'moment'
import { actionKeys } from './actionTypes'
import { crudTypes, createCrudTypes, createAction } from '../store/helpers'
import createCrudService from '../services/createCrudService'
import { displaySnackbar } from '../actions/uiActions'
import { loginActions } from '../actions'

const sponsorPublicCrud = createCrudService('/api/content/sponsor')
const sponsorPrivateCrud = createCrudService('/api/intra/cms/sponsor', true)
const initialItem = { id: -Date.now(), name: '', link: '', logo: '', description: null, activeAt: moment().format(), activeUntil: moment().add(1, 'year').format() }

const SPONSOR = createCrudTypes(actionKeys.sponsor)

const sponsorActions = {
  pending: (crudType) => createAction(SPONSOR[crudType].PENDING),
  success: (response, crudType) => createAction(SPONSOR[crudType].SUCCESS, { response }),
  error: (error, crudType) => createAction(SPONSOR[crudType].ERROR, { error }),
  fetchSponsor(sponsorId) {
    return dispatch => {
      dispatch(this.pending(crudTypes.FETCH))
      sponsorPublicCrud.fetchById(sponsorId)
        .then(response => {
          dispatch(this.success(response, crudTypes.FETCH))
        }).catch(err => {
          const message = 'Sivun noutaminen epäonnistui'
          dispatch(this.error({ common: message }, crudTypes.FETCH))
          dispatch(displayErrorMessage(isUnauthorized(err), message))
          isUnauthorized(err) && dispatch(loginActions.logout('/login'))
        })
    }
  },
  fetchSponsors(attemptAuthorizedRoute) {
    return dispatch => {
      dispatch(this.pending(crudTypes.FETCH))
      const api = attemptAuthorizedRoute ? sponsorPrivateCrud : sponsorPublicCrud
      api.fetchAll()
        .then(response => {
          dispatch(this.success(response, crudTypes.FETCH))
        }).catch(err => {
          const message = 'Yhteistyökumppaneiden noutaminen epäonnistui'
          dispatch(this.error({ common: message }, crudTypes.FETCH))
          dispatch(displayErrorMessage(isUnauthorized(err), message))
          isUnauthorized(err) && dispatch(loginActions.logout('/login'))
        })
    }
  },
  prepareNew() {
    return dispatch => dispatch(this.success(initialItem, crudTypes.CREATE))
  },
  addSponsor(sponsor) {
    return dispatch => {
      dispatch(this.pending(crudTypes.CREATE))
      sponsorPrivateCrud.create(sponsor)
        .then(response => {
          dispatch(this.success(response, crudTypes.CREATE))
          // newly added item has to have negative id created in prepareNew()
          sponsor.id < 0 && dispatch(this.success(sponsor, crudTypes.DELETE)) // remove temporary item
          sponsor.id < 0 && dispatch(displaySnackbar('Luominen onnistui'))
        }).catch(err => {
          const message = 'Luominen epäonnistui'
          dispatch(this.error({ common: message }, crudTypes.CREATE))
          sponsor.id < 0 && dispatch(displayErrorMessage(isUnauthorized(err), message))
          isUnauthorized(err) && dispatch(loginActions.logout('/login'))
        })
    }
  },
  updateSponsor(sponsor) {
    return dispatch => {
      dispatch(this.pending(crudTypes.UPDATE))
      sponsorPrivateCrud.update(sponsor)
        .then(response => {
          dispatch(this.success(response, crudTypes.UPDATE))
          dispatch(displaySnackbar('Tallennus onnistui'))
        }).catch(err => {
          const message = 'Navigaation päivitys epäonnistui'
          dispatch(this.error({ common: message }, crudTypes.UPDATE))
          dispatch(displayErrorMessage(isUnauthorized(err), message))
          isUnauthorized(err) && dispatch(loginActions.logout('/login'))
        })
    }
  },
  removeSponsor(sponsor) {
    return dispatch => {
      const isUnsavedItem = sponsor.id < 0
      if(isUnsavedItem) {
        return dispatch(this.success(sponsor, crudTypes.DELETE))
      }
      dispatch(this.pending(crudTypes.DELETE))
      sponsorPrivateCrud.performDelete(sponsor)
        .then(response => {
          dispatch(this.success(sponsor, crudTypes.DELETE))
          dispatch(displaySnackbar('Poistaminen onnistui'))
        }).catch(err => {
          const message = 'Poistaminen epäonnistui'
          dispatch(this.error({ common: message }, crudTypes.DELETE))
          dispatch(displayErrorMessage(isUnauthorized(err), message))
          isUnauthorized(err) && dispatch(loginActions.logout('/login'))
        })
    }
  }
}

const isUnauthorized = err => err.response && err.response.status === 401

const displayErrorMessage = (isUnauthorized, snackbarMessage) => {
  let message = isUnauthorized ? 'Pääsy kielletty' : snackbarMessage
  return displaySnackbar(message)
}

export default sponsorActions
export { SPONSOR }
