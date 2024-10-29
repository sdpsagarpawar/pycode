import Link from '@mui/material/Link';

 const EmbeddedLink = ({title,link}) => {
  return (
    
      <Link href={link} target="_blank" rel="noreferrer" underline="hover">
        {title}
      </Link>
      
  );
}

export default EmbeddedLink;