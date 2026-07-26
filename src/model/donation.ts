import { DonationExtraData } from './donation-extra-data';
import { DonationIncentiveLink } from './donation-incentive-link';

export class Donation {
  id = -1;
  nickname = '';
  firstName = '';
  lastName = '';
  address = '';
  zipcode = '';
  city = '';
  country = '';
  date = '';
  amount = -1;
  comment = '';
  answers: DonationExtraData[];
  donationIncentiveLinks: DonationIncentiveLink[];

  constructor() {
    this.answers = [];
    this.donationIncentiveLinks = [];
  }
}
