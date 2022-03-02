/// Template filter that returns the section score x-axis translate value for
/// the score bar.
pub fn rs_section_score_arrow_t_x(score: &usize) -> ::askama::Result<f64> {
    Ok((158.0 + *score as f64 * 1.21).round())
}

/// Template filter that returns the width of the section score bar.
pub fn rs_section_score_width(score: &usize) -> ::askama::Result<f64> {
    Ok((*score as f64 * 1.21).round())
}

/// Template filter that returns the rating letter corresponding to the score
/// value provided.
pub fn rating(score: &usize) -> ::askama::Result<char> {
    Ok(clomonitor_core::score::rating(*score))
}