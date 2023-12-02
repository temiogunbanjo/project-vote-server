import HelperUtils from "../utils/HelperUtils";

class Candidate {
  fullname: string;
  imageUrl: string;
  categoryId: string;
  code: number = parseInt(
    HelperUtils.generateRandomCharacters(3, { digitsOnly: true }),
    10
  );
  totalVoteCount: number = 0;

  constructor(fullname: string, imageUrl: string, categoryId: string) {
    this.fullname = fullname;
    this.imageUrl = imageUrl;
    this.categoryId = categoryId;
  }
}

export default Candidate;
